export enum MICROSERVICES_PACKAGES {
  USERS = 'AUTH',
  SNAPS = 'SNAPS',
  STORAGE = 'STORAGE',
}

// tokens.ts
export const AUTH_GRPC = 'AUTH_GRPC';
export const STORAGE_GRPC = 'STORAGE_GRPC';
export const STORAGE_REDIS = 'STORAGE_REDIS';

export const MICROSERVICES: {
  [K in keyof typeof MICROSERVICES_PACKAGES]: {
    package: (typeof MICROSERVICES_PACKAGES)[K];
    host: string;
    grpcPort?: string;
    redis?: {
      package: string;
      redisPort?: string;
    };
  };
} = {
  USERS: {
    package: MICROSERVICES_PACKAGES.USERS,
    grpcPort: '50051',
    host: 'nowhere-auth',
  },
  SNAPS: {
    package: MICROSERVICES_PACKAGES.SNAPS,
    host: 'nest-dev',
  },
  STORAGE: {
    package: MICROSERVICES_PACKAGES.STORAGE,
    grpcPort: '50052',
    redis: {
      package: MICROSERVICES_PACKAGES.STORAGE + '_REDIS',
      redisPort: '6379',
    },
    host: 'nowhere-storage',
  },
};
