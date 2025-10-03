import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

export const authProtoOptions: MicroserviceOptions = {
  transport: Transport.GRPC,
  options: {
    package: 'AUTH',
    protoPath: join(__dirname, 'auth-user.proto'),
    url: 'nowhere-auth:50051',
  },
};

export const authProtoLocalOptions: MicroserviceOptions = {
  transport: Transport.GRPC,
  options: {
    package: 'AUTH',
    protoPath: join(__dirname, 'auth-user.proto'),
    url: '0.0.0.0:50051',
  },
};

export const storageProtoLocalOptions: MicroserviceOptions = {
  transport: Transport.GRPC,
  options: {
    package: 'STORAGE',
    protoPath: join(__dirname, 'storage.proto'),
    url: '0.0.0.0:50051',
  },
};

export const storageProtoOptions: MicroserviceOptions = {
  transport: Transport.GRPC,
  options: {
    package: 'STORAGE',
    protoPath: join(__dirname, 'storage.proto'),
    url: 'nowhere-storage:50051',
  },
};
