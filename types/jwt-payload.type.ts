import { User } from 'src/users/entities/user.entity';

export type JWTPayload = {
  sub: number;
  user: Omit<User, 'password'>;
};
