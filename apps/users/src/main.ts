import { NestFactory } from '@nestjs/core';
import { UsersAppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  HttpExceptionFilter,
  NatsRpcExceptionFilter,
  natsConnectionOptions,
} from 'nowhere-common';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(UsersAppModule);
  app.use(helmet());
  app.useGlobalFilters(new HttpExceptionFilter(), new NatsRpcExceptionFilter());
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
    options: natsConnectionOptions(),
  });
  await app.startAllMicroservices();

  await app.listen(process.env.PORT || process.env.NEST_PORT || 3001, '0.0.0.0');
}
void bootstrap();
