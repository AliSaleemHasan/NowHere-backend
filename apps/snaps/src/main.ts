import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  DataResponseInterceptor,
  HttpExceptionFilter,
  NowHereLogger,
  setupSwagger,
  MICROSERVICES,
} from 'nowhere-common';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new NowHereLogger('MainApp', {
      prefix: 'NowHere    ',
    }),
  });

  setupSwagger(app, { name: 'backend', port: 3000 });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new DataResponseInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      enableDebugMessages: true,
      disableErrorMessages: false,
      stopAtFirstError: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = errors.map((err) =>
          Object.values(err.constraints || {}).join(', '),
        );
        return new BadRequestException(messages);
      },
    }),
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      port: Number(MICROSERVICES.STORAGE.redis?.redisPort || 6379),
      host: 'redis',
    },
  });

  app.use(helmet());

  await app.startAllMicroservices();

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
