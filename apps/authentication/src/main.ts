import { NestFactory } from '@nestjs/core';
import { AuthenticationModule } from './authentication.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthenticationModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [process.env.NATS_URL || 'nats://nats:4222'],
      },
    },
  );
  await app.listen();
}
bootstrap();
