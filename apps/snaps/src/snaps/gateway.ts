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
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CreateSnapDto } from 'nowhere-common/dto/snaps/create-snap.dto';

type UserSocket = {
  socketId: string;
  coordinates: [number, number];
};

type LocationChangeBody = Pick<UserSocket, 'coordinates'>;

function socketCorsOrigin(): string | string[] | boolean {
  const fromCors = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (fromCors.length > 0) {
    return fromCors;
  }
  if (process.env.GATEWAY_URL) {
    return process.env.GATEWAY_URL;
  }
  return process.env.NODE_ENV === 'production' ? false : true;
}

@WebSocketGateway({
  cors: {
    origin: socketCorsOrigin(),
    credentials: true,
  },
})
export class SnapsGateway
  implements OnGatewayInit, OnGatewayDisconnect, OnGatewayConnection
{
  private readonly logger = new Logger(SnapsGateway.name, { timestamp: true });
  @WebSocketServer()
  server: Server;

  /**
   * In-memory location map. Does not survive process restart or a second
   * snaps replica — sticky sessions or a shared store is a later phase.
   */
  usersLocationMap: Map<string, UserSocket>;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit() {
    this.logger.log('Server Started');
    this.logger.log('Creating in memory User Location Map');
    this.usersLocationMap = new Map<string, UserSocket>();
    this.logger.log('UsersLocationMap Created ...');
  }

  handleConnection(client: Socket) {
    const token = this.extractHandshakeToken(client);
    if (!token) {
      this.logger.warn(`Socket ${client.id} missing access token`);
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('ACCESS_SECRET'),
      });
      client.data.user = payload.user || payload;
    } catch {
      this.logger.warn(`Socket ${client.id} presented an invalid token`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    if (this.usersLocationMap?.get(client.id))
      this.usersLocationMap.delete(client.id);
  }

  @SubscribeMessage('locationChange')
  locationChange(
    @MessageBody() data: LocationChangeBody,
    @ConnectedSocket() client: Socket,
  ) {
    this.usersLocationMap.set(client.id, {
      coordinates: data.coordinates,
      socketId: client.id,
    });

    return this.usersLocationMap.get(client.id);
  }

  getDistanceInMeters(
    latitude1: number,
    longitude1: number,
    latitude2: number,
    longitude2: number,
  ): number {
    const toRadians = (degrees: number) => degrees * (Math.PI / 180);

    const earthRadiusMeters = 6371e3;

    const lat1Rad = toRadians(latitude1);
    const lat2Rad = toRadians(latitude2);
    const deltaLat = toRadians(latitude2 - latitude1);
    const deltaLon = toRadians(longitude2 - longitude1);

    const haversineA =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLon / 2) ** 2;

    const haversineC =
      2 * Math.atan2(Math.sqrt(haversineA), Math.sqrt(1 - haversineA));

    return earthRadiusMeters * haversineC;
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

  handleNewSnap(body: CreateSnapDto) {
    const users = this.findNearbyUsers(
      body.location.coordinates[1],
      body.location.coordinates[0],
      100,
    );

    users.forEach((user) => {
      this.server.to(user.socketId).emit('snap-added', body);
    });
  }

  private extractHandshakeToken(client: Socket): string | undefined {
    const fromAuth = client.handshake?.auth?.token;
    if (typeof fromAuth === 'string' && fromAuth.length > 0) {
      return fromAuth.replace(/^Bearer\s+/i, '');
    }
    const header = client.handshake?.headers?.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }
    return undefined;
  }
}
