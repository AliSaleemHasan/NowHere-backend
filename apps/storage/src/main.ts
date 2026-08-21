import { NestFactory } from '@nestjs/core';
import { StorageModule } from './storage.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { MICROSERVICES, HttpExceptionFilter, DataResponseInterceptor } from 'nowhere-common';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { storageProtoLocalOptions } from 'proto';
async function bootstrap() {
  const app = await NestFactory.create(StorageModule);
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new DataResponseInterceptor());

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      port: Number(MICROSERVICES.STORAGE.redis?.redisPort || 6379),
      host: 'redis',
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: storageProtoLocalOptions,
  });

  await app.startAllMicroservices();
  await app.listen(3002);
}
bootstrap();
