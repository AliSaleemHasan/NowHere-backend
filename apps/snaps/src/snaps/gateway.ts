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
import {
  extractBearerToken,
  haversineMeters,
  parseCorsOrigins,
} from 'nowhere-common';

type UserSocket = {
  socketId: string;
  coordinates: [number, number];
};

type LocationChangeBody = Pick<UserSocket, 'coordinates'>;

function socketCorsOrigin() {
  return parseCorsOrigins({
    fallback: process.env.GATEWAY_URL || true,
  });
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

  findNearbyUsers(lat: number, lng: number, radiusKm: number) {
    const radiusInMeters = radiusKm * 1000;
    if (!this.usersLocationMap) return [];

    return Array.from(this.usersLocationMap.values()).filter((user) => {
      if (!user?.coordinates || user.coordinates.length < 2) return false;
      return (
        haversineMeters(
          lat,
          lng,
          user.coordinates[1],
          user.coordinates[0],
        ) <= radiusInMeters
      );
    });
  }

  handleNewSnap(body: { location?: { coordinates?: [number, number] } }) {
    const coordinates = body?.location?.coordinates;
    if (!coordinates || coordinates.length < 2) return;

    const users = this.findNearbyUsers(coordinates[1], coordinates[0], 100);

    users.forEach((user) => {
      this.server.to(user.socketId).emit('snap-added', body);
    });
  }

  private extractHandshakeToken(client: Socket): string | undefined {
    const fromAuth = client.handshake?.auth?.token;
    if (typeof fromAuth === 'string' && fromAuth.length > 0) {
      return extractBearerToken(fromAuth) ?? fromAuth;
    }
    const header = client.handshake?.headers?.authorization;
    return extractBearerToken(Array.isArray(header) ? header[0] : header);
  }
}
