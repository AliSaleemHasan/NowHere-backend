import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import * as path from 'path';
import { getValidateFn, NatsClientModule } from 'nowhere-common';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { GatewayAuthController } from './controllers/gateway-auth.controller';
import { GatewayUsersController } from './controllers/gateway-users.controller';
import { GatewaySnapsController } from './controllers/gateway-snaps.controller';
import { GatewayStorageController } from './controllers/gateway-storage.controller';
import { HealthController } from './health.controller';
import { GatewayAuthGuard } from './guards/auth.guard';
import { GatewayEnvVariables } from './utils/gateway-env-variables';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [path.resolve(process.cwd(), '.env')],
      validate: getValidateFn(GatewayEnvVariables),
    }),
    JwtModule.register({
      global: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 60,
      },
    ]),
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
  providers: [
    GatewayAuthGuard,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [GatewayAuthGuard],
})
export class GatewayModule {}
