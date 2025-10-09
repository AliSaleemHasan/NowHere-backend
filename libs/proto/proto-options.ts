import { join } from 'path';

export const authProtoOptions = {
  package: 'AUTH',
  protoPath: join(__dirname, 'auth-user.proto'),
  url: 'nowhere-auth:50051',
};

export const authProtoLocalOptions = {
  package: 'AUTH',
  protoPath: join(__dirname, 'auth-user.proto'),
  url: '0.0.0.0:50051',
};

export const storageProtoLocalOptions = {
  package: 'STORAGE',
  protoPath: join(__dirname, 'storage.proto'),
  url: '0.0.0.0:50051',
};

export const storageProtoOptions = {
  package: 'STORAGE',
  protoPath: join(__dirname, 'storage.proto'),
  url: 'nowhere-storage:50051',
};
