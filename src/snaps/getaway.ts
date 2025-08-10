import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { SnapsService } from './snaps.service';
import { CreateSnapDto } from './dto/create-snap.dto';
import { formDataToObject } from 'common/utils/form-data-to-json';
import { BadRequestException } from '@nestjs/common';

type UserSocket = {
  userId: string;
  socketId: string;
  coordinates: [number, number];
};

type LocationChangeBody = Pick<UserSocket, 'coordinates'>;
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000'],
  },
})
export class SnapsGetaway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private authService: AuthService) {}

  usersLocationMap: Map<string, UserSocket>;
  afterInit(server: any) {
    console.log('Server Started');
    console.log('Creating in memory User Location Map');
    this.usersLocationMap = new Map<string, UserSocket>();
    console.log('UsersLocationMap Created ...');
  }

  // we check if the user is loggedIn first
  async handleConnection(client: Socket, ...args: any[]) {
    // TODO: change this to client.handshake.auth.token
    const token = client.handshake.headers.authorization;

    try {
      const user = await this.authService.verifyJwtToken(token);
      client.data.userId = user._id;
    } catch (err) {
      client.disconnect(true); // if not logged in the connection will be refused
    }
  }

  // remove  client from the map
  handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (this.usersLocationMap.get(userId)) this.usersLocationMap.delete(userId);
  }

  // when user Locaiton Change
  @SubscribeMessage('locationChange')
  locationChange(
    @MessageBody() data: LocationChangeBody,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    this.usersLocationMap.set(userId, {
      userId,
      coordinates: data.coordinates,
      socketId: client.id,
    });
    return this.usersLocationMap.get(userId);
  }

  getDistanceInMeters(
    latitude1: number,
    longitude1: number,
    latitude2: number,
    longitude2: number,
  ): number {
    const toRadians = (degrees: number) => degrees * (Math.PI / 180);

    const earthRadiusMeters = 6371e3; // Radius of Earth in meters

    const lat1Rad = toRadians(latitude1);
    const lat2Rad = toRadians(latitude2);
    const deltaLat = toRadians(latitude2 - latitude1);
    const deltaLon = toRadians(longitude2 - longitude1);

    const haversineA =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLon / 2) ** 2;

    const haversineC =
      2 * Math.atan2(Math.sqrt(haversineA), Math.sqrt(1 - haversineA));

    const distance = earthRadiusMeters * haversineC;

    return distance; // in meters
  }

  findNearbyUsers(lat: number, lng: number, radiusKm: number) {
    const radiusInMeters = radiusKm * 1000;

    return Array.from(this.usersLocationMap.values()).filter((user) => {
      const distance = this.getDistanceInMeters(
        lat,
        lng,
        user.coordinates[1],
        user.coordinates[0],
      );
      return distance <= radiusInMeters;
    });
  }

  @SubscribeMessage('snap-added')
  handleGetNewSnaps(@MessageBody() snap: CreateSnapDto) {
    return snap;
  }

  // A user Posts a Snap
  async handleNewSnap(body: CreateSnapDto) {
    // first handle posting this snap to snaps Service
    try {
      const users = this.findNearbyUsers(
        body.location.coordinates[1],
        body.location.coordinates[0],
        100,
      );

      users.forEach((user) => {
        this.server.to(user.socketId).emit('snap-added', body);
      });
    } catch (err) {
      console.log(err);
      throw new BadRequestException(err);
    }
  }
}
