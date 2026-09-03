import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import {
  createEnvConfigModule,
  HealthModule,
  NatsClientModule,
} from 'nowhere-common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { GatewayAuthController } from './controllers/gateway-auth.controller';
import { GatewayUsersController } from './controllers/gateway-users.controller';
import { GatewaySnapsController } from './controllers/gateway-snaps.controller';
import { GatewayStorageController } from './controllers/gateway-storage.controller';
import { GatewayAuthGuard } from './guards/auth.guard';
import { GatewayEnvVariables } from './utils/gateway-env-variables';
import { GatewayRpcClient } from './rpc/gateway-rpc.client';

@Module({
  imports: [
    createEnvConfigModule(GatewayEnvVariables),
    JwtModule.register({
      global: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 60,
      },
    ]),
    NatsClientModule.register(),
    HealthModule.forMemory(),
  ],
  controllers: [
    GatewayAuthController,
    GatewayUsersController,
    GatewaySnapsController,
    GatewayStorageController,
  ],
  providers: [
    GatewayAuthGuard,
    GatewayRpcClient,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [GatewayAuthGuard],
})
export class GatewayModule {}
