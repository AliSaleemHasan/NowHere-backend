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
  async validateUser(username: string, password: string): Promise<User> {
    // first getting the user from the data base
    const user = await this.usersService.getUserByUsername(username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException();
    }
    return user;
  }

  async login(username: string, password: string) {
    const validatedUser = await this.validateUser(username, password);
    const tokens = this.generateTokens(
      validatedUser.username,
      validatedUser._id,
    );
    return tokens;
  }
  async signup(createUserDto: CreateUserDTO) {
    const salt = await bcrypt.genSalt();
    createUserDto.password = await bcrypt.hash(createUserDto.password, salt);

    try {
      await this.usersService.createUser(createUserDto);
    } catch (error) {
      console.error('Signup error:', error);
      throw new BadRequestException('Username already exists');
    }
  }

  // this function is for refreshing the token if
  async refreshToken(token: string) {
    // validate the recieved refresh token
    try {
      const payload = await this.jwt.verifyAsync<JWTPayload>(token, {
        secret: this.configService.get('REFRESH_SECRET'),
      });
      const newTokens = await this.generateTokens(
        payload.username,
        payload.sub,
      );
      return newTokens;
    } catch {
      throw new UnauthorizedException();
    }
  }
  async generateTokens(username: string, _id: number) {
    const payload = { sub: _id, username };

    console.log(this.configService.get('ACCESS_SECRET'));
    const accessToken = await this.jwt.sign(payload, {
      secret: this.configService.get('ACCESS_SECRET'),
      expiresIn: this.configService.get('ACCESS_EXP'),
    });

    const refreshToken = await this.jwt.sign(payload, {
      secret: this.configService.get('REFRESH_SECRET'),
      expiresIn: this.configService.get('REFRESH_EXP'),
    });

    return { accessToken, refreshToken };
  }
}
