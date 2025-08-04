import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDTO } from 'src/users/dto/create-user.dto';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { JWTPayload } from 'types/jwt-payload.type';
@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}
  async validateUser(email: string, password: string): Promise<User> {
    // first getting the user from the data base
    const user = await this.usersService.getUserByEmail(email);

    if (!user)
      throw new UnauthorizedException('User not found, please sign up');

    if (!(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Wrong password');
    }
    return user;
  }

  async login(email: string, password: string) {
    const { password: _, ...user } = await this.validateUser(email, password);
    const tokens = await this.generateTokens(user, user._id);
    console.log(tokens);
    return { user, tokens };
  }
  async signup(createUserDto: CreateUserDTO) {
    const salt = await bcrypt.genSalt();
    createUserDto.password = await bcrypt.hash(createUserDto.password, salt);

    try {
      return await this.usersService.createUser(createUserDto);
    } catch (error) {
      console.error('Signup error:', error);
      throw new BadRequestException('Email already exists');
    }
  }

  // this function is for refreshing the token if
  async refreshToken(token: string) {
    // validate the recieved refresh token
    try {
      const payload = await this.jwt.verifyAsync<JWTPayload>(token, {
        secret: this.configService.get('REFRESH_SECRET'),
      });
      const newTokens = await this.generateTokens(payload.user, payload.sub);
      return newTokens;
    } catch {
      throw new UnauthorizedException(
        'User Session has been ended, please login-agin',
      );
    }
  }
  async generateTokens(user: Partial<User>, _id: number) {
    const payload = { sub: _id, user };

    console.log(this.configService.get('ACCESS_SECRET'));
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

  // a function to verify a jwt token and return it's paylod
  async verifyJwtToken(token?: string): Promise<Partial<User>> {
    if (!token) throw new UnauthorizedException('User is not loggedin/found');
    try {
      const payload = await this.jwt.verifyAsync<JWTPayload>(token, {
        secret: this.configService.get('ACCESS_SECRET'),
      });

      if (!payload.user) throw new Error('User is not found in the token');
      return payload.user;
    } catch (err: any) {
      throw new UnauthorizedException(JSON.stringify(err));
    }
  }
}
