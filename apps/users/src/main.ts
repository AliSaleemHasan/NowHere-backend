import { NestFactory } from '@nestjs/core';
import { UsersAppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  setupSwagger,
  HttpExceptionFilter,
  DataResponseInterceptor,
} from 'nowhere-common';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(UsersAppModule);
  app.use(helmet());

  setupSwagger(app, { port: 3001, name: 'users' });
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
    transport: Transport.NATS,
    options: {
      servers: [process.env.NATS_URL || 'nats://nats:4222'],
    },
  });
  await app.startAllMicroservices();

  await app.listen(3001); // HTTP port
}
bootstrap();
