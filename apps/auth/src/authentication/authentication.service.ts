import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
// import { JWTPayload } from 'types/jwt-payload.type';

import { UsersService } from '../users/users.service';
import { CreateUserDTO } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { GrpcService } from '../grpc/grpc.service';
@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name, {
    timestamp: true,
  });

  constructor(
    private jwt: JwtService,
    private usersService: UsersService,
    private configService: ConfigService,
    private grpcService: GrpcService,
  ) {}

  async login(email: string, password: string) {
    // first getting the user from the data base
    const user = await this.usersService.getUserByEmail(email);

    if (!user)
      throw new UnauthorizedException('User not found, please sign up');

    if (!(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Wrong password');
    }

    const tokens = await this.generateTokens(user, user._id);
    return { user, tokens };
  }

  async signup(createUserDto: CreateUserDTO) {
    const salt = await bcrypt.genSalt();
    createUserDto.password = await bcrypt.hash(createUserDto.password, salt);

    try {
      let newUser = await this.usersService.createUser(createUserDto);

      // create settings object for the user
      await this.grpcService.getUserSetting(newUser._id);

      return newUser;
    } catch (error) {
      this.logger.error('Signup error:', error);
      throw new BadRequestException('Email already exists');
    }
  }

  // this function is for refreshing the token if
  async refreshToken(token?: string) {
    if (!token) throw new UnauthorizedException('No refresh token provided!');

    // validate the recieved refresh token
    try {
      const payload = await this.jwt.verifyAsync<any>(token, {
        secret: this.configService.get('REFRESH_SECRET'),
      });
      const newTokens = await this.generateTokens(payload.user, payload.sub);
      return { user: payload.user, tokens: newTokens };
    } catch {
      throw new UnauthorizedException(
        'User Session has been ended, please login-agin',
      );
    }
  }

  async generateTokens(user: Partial<User>, _id: string) {
    const payload = { sub: _id, user };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.configService.get('ACCESS_SECRET'),
      expiresIn: this.configService.get('ACCESS_EXP'),
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.configService.get('REFRESH_SECRET'),
      expiresIn: this.configService.get('REFRESH_EXP'),
    });

    return { accessToken, refreshToken };
  }
}
