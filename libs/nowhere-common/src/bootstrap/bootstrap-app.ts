import {
  BadRequestException,
  INestApplication,
  Type,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationError } from 'class-validator';
import helmet from 'helmet';
import { HttpExceptionFilter, NatsRpcExceptionFilter } from '../filters';
import { DataResponseInterceptor } from '../interceptors';
import { natsConnectionOptions } from '../nats';
import { parseCorsOrigins } from './cors';

type HelmetOptions = Parameters<typeof helmet>[0];

export interface BootstrapAppOptions {
  module: Type<unknown>;
  defaultPort: number;
  enableHelmet?: boolean;
  helmetOptions?: HelmetOptions;
  enableCors?: boolean;
  requireCorsInProduction?: boolean;
  enableValidation?: boolean;
  enableResponseInterceptor?: boolean;
  microservice?: boolean;
  inheritAppConfig?: boolean;
  beforeListen?: (app: INestApplication) => void | Promise<void>;
}

export function resolveListenPort(defaultPort: number): number {
  return Number(process.env.PORT || process.env.NEST_PORT || defaultPort);
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors: ValidationError[]) => {
      const messages = errors.map((err) =>
        Object.values(err.constraints || {}).join(', '),
      );
      return new BadRequestException(messages);
    },
  });
}

export async function bootstrapApp(
  options: BootstrapAppOptions,
): Promise<INestApplication> {
  const {
    module,
    defaultPort,
    enableHelmet = true,
    helmetOptions,
    enableCors = false,
    requireCorsInProduction = false,
    enableValidation = true,
    enableResponseInterceptor = false,
    microservice = false,
    inheritAppConfig = false,
    beforeListen,
  } = options;

  const app = await NestFactory.create(module);

  if (enableHelmet) {
    app.use(helmetOptions ? helmet(helmetOptions) : helmet());
  }

  if (enableCors) {
    app.enableCors({
      origin: parseCorsOrigins({
        requireInProduction: requireCorsInProduction,
      }),
      credentials: true,
    });
  }

  app.useGlobalFilters(new HttpExceptionFilter(), new NatsRpcExceptionFilter());

  if (enableValidation) {
    app.useGlobalPipes(createValidationPipe());
  }

  if (enableResponseInterceptor) {
    app.useGlobalInterceptors(new DataResponseInterceptor());
  }

  if (microservice) {
    app.connectMicroservice<MicroserviceOptions>(
      {
        transport: Transport.NATS,
        options: natsConnectionOptions(),
      },
      inheritAppConfig ? { inheritAppConfig: true } : undefined,
    );
    await app.startAllMicroservices();
  }

  if (beforeListen) {
    await beforeListen(app);
  }

  await app.listen(resolveListenPort(defaultPort), '0.0.0.0');
  return app;
}
