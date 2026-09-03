import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  HttpExceptionFilter,
  NatsRpcExceptionFilter,
  natsConnectionOptions,
} from 'nowhere-common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter(), new NatsRpcExceptionFilter());

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: natsConnectionOptions(),
  });

  await app.startAllMicroservices();
  // HTTP server kept for WebSocket gateway upgrade handshake and /health
  await app.listen(process.env.PORT || process.env.NEST_PORT || 3000, '0.0.0.0');
}
void bootstrap();
