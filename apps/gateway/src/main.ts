import { bootstrapApp } from 'nowhere-common';
import { GatewayModule } from './gateway.module';

void bootstrapApp({
  module: GatewayModule,
  defaultPort: 3005,
  enableCors: true,
  requireCorsInProduction: true,
  enableResponseInterceptor: true,
});
