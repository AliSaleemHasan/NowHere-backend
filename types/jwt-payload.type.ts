import { Roles, User } from 'apps/auth/src/users/entities/user.entity';

export type JWTPayload = {
  sub: string;
  user: Omit<User, 'password'>;
  role: Roles;
};
