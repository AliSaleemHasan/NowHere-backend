import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

export const authProtoOptions: MicroserviceOptions = {
  transport: Transport.GRPC,
  options: {
    package: 'auth',
    protoPath: join(__dirname, 'auth-user.proto'),
    url: 'nowhere-auth:50051',
  },
};
