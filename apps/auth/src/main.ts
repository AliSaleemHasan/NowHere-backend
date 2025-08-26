import { NestFactory } from '@nestjs/core';
import { AuthModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AUTH_PACKAGE_NAME } from 'common/proto/auth/auth';
import { setupSwagger } from 'common/config/setup-swagger';
import { HttpExceptionFilter } from 'common/filters/http-exception-filter';
import { DataResponseInterceptor } from 'common/interceptors/data-response-interceptor';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: AUTH_PACKAGE_NAME,
      protoPath: join(__dirname, '..', 'auth.proto'),
    },
  });
  setupSwagger(app, { port: 50051, name: 'auth' });
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

  await app.startAllMicroservices();
  await app.listen(50051); // HTTP port
}
bootstrap();
