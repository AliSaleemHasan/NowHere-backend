export enum MICROSERVICES_PACKAGES {
  AUTH = 'AUTHENTICATION',
  USERS = 'USERS',
  SNAPS = 'SNAPS',
  STORAGE = 'STORAGE',
}

// Tokens
export const NATS_CLIENT = 'NATS_CLIENT';

export const MICROSERVICES: {
  [K in keyof typeof MICROSERVICES_PACKAGES]: {
    package: (typeof MICROSERVICES_PACKAGES)[K];
    host: string;
    port?: number;
  };
} = {
  AUTH: {
    package: MICROSERVICES_PACKAGES.AUTH,
    host: 'authentication',
    port: 3004,
  },
  USERS: {
    package: MICROSERVICES_PACKAGES.USERS,
    host: 'nowhere-users',
    port: 3001,
  },
  SNAPS: {
    package: MICROSERVICES_PACKAGES.SNAPS,
    host: 'nowhere-snaps',
    port: 3000,
  },
  STORAGE: {
    package: MICROSERVICES_PACKAGES.STORAGE,
    host: 'nowhere-storage',
    port: 3002,
  },
};
