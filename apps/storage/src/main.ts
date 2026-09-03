import { NestFactory } from '@nestjs/core';
import { StorageModule } from './storage.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  HttpExceptionFilter,
  NatsRpcExceptionFilter,
  natsConnectionOptions,
} from 'nowhere-common';

async function bootstrap() {
  const app = await NestFactory.create(StorageModule);
  app.useGlobalFilters(new HttpExceptionFilter(), new NatsRpcExceptionFilter());
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: natsConnectionOptions(),
  });
  await app.startAllMicroservices();
  await app.listen(process.env.PORT || process.env.NEST_PORT || 3002, '0.0.0.0');
}
void bootstrap();
