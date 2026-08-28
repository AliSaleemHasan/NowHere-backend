import { User } from 'apps/users/src/users/entities/user.entity';
import { ROLES } from 'contracts';

export type JWTPayload = {
  sub: string;
  user: Omit<User, 'password'>;
  role: ROLES;
};
