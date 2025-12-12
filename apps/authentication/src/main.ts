import { NestFactory } from '@nestjs/core';
import { AuthenticationModule } from './authentication.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { credentialsProtoLocalOptions } from '../../../libs/proto/proto-options';


async function bootstrap() {
  const app = await NestFactory.create(AuthenticationModule);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: credentialsProtoLocalOptions,
  });
  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3004, '0.0.0.0');
}
bootstrap();
