import { NestFactory } from '@nestjs/core';
import { StorageModule } from './storage.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { MICROSERVICES } from 'nowhere-common';

import helmet from 'helmet';
import { storageProtoLocalOptions } from 'proto';
async function bootstrap() {
  const app = await NestFactory.create(StorageModule);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      port: Number(MICROSERVICES.STORAGE.redis?.redisPort || 6379),
      host: 'redis',
    },
  });

  app.connectMicroservice<MicroserviceOptions>(storageProtoLocalOptions);

  app.use(helmet());
  await app.startAllMicroservices();
  await app.listen(3002);
}
bootstrap();
