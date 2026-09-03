import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter, DataResponseInterceptor } from 'nowhere-common';
import helmet from 'helmet';

function parseCorsOrigins(): string[] | boolean {
  const raw = process.env.CORS_ORIGIN;
  const origins = (raw || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV === 'production') {
    if (origins.length === 0) {
      throw new Error('CORS_ORIGIN is required in production');
    }
    return origins;
  }

  return origins.length > 0 ? origins : true;
}

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);
  app.use(helmet());
  app.enableCors({
    origin: parseCorsOrigins(),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new DataResponseInterceptor());
  await app.listen(process.env.PORT ?? process.env.NEST_PORT ?? 3005, '0.0.0.0');
}
void bootstrap();
