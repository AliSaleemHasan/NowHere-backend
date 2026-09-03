import { ROLES } from 'contracts';

export type JWTPayload = {
  sub: string;
  user: {
    id: string;
    email: string;
    role?: ROLES | string;
  };
  role?: ROLES | string;
};
