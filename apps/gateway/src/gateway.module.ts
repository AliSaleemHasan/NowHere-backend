import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { credentialsProtoOptions } from 'proto';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import * as path from 'path';
import {
  SnapsProxyMiddleware,
  UsersProxyMiddleware,
  StorageProxyMiddleware,
} from './proxy/service-proxy.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [path.resolve(process.cwd(), '.env')],
    }),
    JwtModule.register({
      global: true,
    }),
    // Only the Authentication gRPC client — needed for login/signup/refresh.
    // All other services are reached via HTTP reverse proxy.
    ClientsModule.register([
      {
        name: 'CREDENTIALS_PACKAGE',
        transport: Transport.GRPC,
        options: credentialsProtoOptions,
      },
    ]),
  ],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Proxy all non-auth traffic to downstream services.
    // Auth endpoints (auth/*) are handled natively by GatewayController.
    consumer.apply(SnapsProxyMiddleware).forRoutes('snaps');
    consumer.apply(UsersProxyMiddleware).forRoutes('users');
    consumer.apply(StorageProxyMiddleware).forRoutes('storage');
  }
}
