import { bootstrapApp } from 'nowhere-common';
import { GatewayModule } from './gateway.module';
import { setupSwagger } from './swagger';

const enableSwagger = process.env.ENABLE_SWAGGER === 'true';

void bootstrapApp({
  module: GatewayModule,
  defaultPort: 3005,
  enableCors: true,
  requireCorsInProduction: true,
  enableResponseInterceptor: true,
  helmetOptions: enableSwagger ? { contentSecurityPolicy: false } : undefined,
  beforeListen: enableSwagger ? (app) => setupSwagger(app) : undefined,
});
