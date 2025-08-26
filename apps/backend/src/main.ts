import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataResponseInterceptor } from 'common/interceptors/data-response-interceptor';
import { HttpExceptionFilter } from 'common/filters/http-exception-filter';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { NowHereLogger } from 'common/loggers/nowhere-logger';
import { setupSwagger } from 'common/config/setup-swagger';

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

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
