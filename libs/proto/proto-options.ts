import { join } from 'path';

export const usersProtoOptions = {
  package: 'USERS',
  protoPath: join(__dirname, 'users.proto'),
  url: 'nowhere-users:50051',
};

export const usersProtoLocalOptions = {
  package: 'USERS',
  protoPath: join(__dirname, 'users.proto'),
  url: '0.0.0.0:50051',
};

export const storageProtoLocalOptions = {
  package: 'STORAGE',
  protoPath: join(__dirname, 'storage.proto'),
  url: '0.0.0.0:50053',
};


export const storageProtoOptions = {
  package: 'STORAGE',
  protoPath: join(__dirname, 'storage.proto'),
  url: 'nowhere-storage:50053',
};

export const credentialsProtoOptions = {
  package: 'AUTHENTICATION',
  protoPath: join(__dirname, 'authentication.proto'),
  url: 'authentication:50052',
};

export const credentialsProtoLocalOptions = {
  package: 'AUTHENTICATION',
  protoPath: join(__dirname, 'authentication.proto'),
  url: '0.0.0.0:50052',
};
