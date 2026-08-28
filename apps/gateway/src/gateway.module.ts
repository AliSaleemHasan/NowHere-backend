import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import * as path from 'path';
import { NatsClientModule } from 'nowhere-common';
import { TerminusModule } from '@nestjs/terminus';
import { GatewayAuthController } from './controllers/gateway-auth.controller';
import { GatewayUsersController } from './controllers/gateway-users.controller';
import { GatewaySnapsController } from './controllers/gateway-snaps.controller';
import { GatewayStorageController } from './controllers/gateway-storage.controller';
import { HealthController } from './health.controller';
import { GatewayAuthGuard } from './guards/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [path.resolve(process.cwd(), '.env')],
    }),
    JwtModule.register({
      global: true,
    }),
    NatsClientModule.register('NATS_CLIENT'),
    TerminusModule,
  ],
  controllers: [
    GatewayAuthController,
    GatewayUsersController,
    GatewaySnapsController,
    GatewayStorageController,
    HealthController,
  ],
  providers: [GatewayAuthGuard],
  exports: [GatewayAuthGuard],
})
export class GatewayModule {}
