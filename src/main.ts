import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataResponseInterceptor } from 'common/interceptors/data-response-interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new DataResponseInterceptor());
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
