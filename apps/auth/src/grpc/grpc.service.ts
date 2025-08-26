import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User, ValidateUserDto } from 'common/proto/auth/auth';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JWTPayload } from 'types/jwt-payload.type';

@Injectable()
export class GrpcService {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
    private jwt: JwtService,
  ) {}

  async validateUser(validateUserDto: ValidateUserDto): Promise<User> {
    // first getting the user from the data base
    const user = await this.usersService.getUserByEmail(validateUserDto.email);

    if (!user)
      throw new UnauthorizedException('User not found, please sign up');

    if (!(await bcrypt.compare(validateUserDto.password, user.password))) {
      throw new UnauthorizedException('Wrong password');
    }
    return user;
  }

  // a function to verify a jwt token and return it's paylod
  async validateToken(token?: string): Promise<User> {
    if (!token) throw new UnauthorizedException('User is not loggedin/found');
    try {
      const payload = await this.jwt.verifyAsync<JWTPayload>(token, {
        secret: this.configService.get('ACCESS_SECRET'),
      });

      if (!payload.user) throw new Error('User is not found in the token');

      const user = await this.usersService.getUserByEmail(payload.user.email);

      if (!user)
        throw new UnauthorizedException('User not found, please sign up');

      return payload.user as User;
    } catch (err: any) {
      throw new UnauthorizedException(JSON.stringify(err.message));
    }
  }
}
