import { NestFactory } from '@nestjs/core';
import { StorageModule } from './storage.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { MICROSERVICES } from 'nowhere-common';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(StorageModule);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      port: Number(MICROSERVICES.STORAGE.redisPort || 6379),
      host: 'redis',
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: MICROSERVICES.STORAGE.package,
      url: `${MICROSERVICES.STORAGE.host}:${MICROSERVICES.STORAGE.grpcPort}`,
      protoPath: join(__dirname, '..', 'storage.proto'),
    },
  });

  await app.startAllMicroservices();
  await app.listen(3002);
}
bootstrap();
