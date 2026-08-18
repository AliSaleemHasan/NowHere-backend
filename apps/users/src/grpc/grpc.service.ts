import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { mapProtoToEntityDto } from './mappers/user-mappers';
import {
  CreateUserDTO,
  UserSetting,
  UserSeenObject,
  CreateUser,
  UserNotSeenObject,
} from 'proto';
import { tryCatch } from 'nowhere-common';

@Injectable()
export class GrpcService {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
    private jwt: JwtService,
  ) {}

  async getAllUsers() {
    return await this.usersService.getAllUsers();
  }

  async createUser(createUserDto: CreateUser) {
    const { error, data } = await tryCatch(
      this.usersService.createUser(createUserDto),
    );
    if (error) return {};
    return data;
  }

  //TODO: This should be implemented in auth or gateway service

  // async validateUser(validateUserDto: ValidateUserDto): Promise<User> {
  //   // first getting the user from the data base
  //   const user = await this.usersService.getUserByEmail(validateUserDto.email);

  //   if (!user)
  //     throw new UnauthorizedException('User not found, please sign up');

  //   if (!(await bcrypt.compare(validateUserDto.password, user.password))) {
  //     throw new UnauthorizedException('Wrong password');
  //   }
  //   return user;
  // }

  // a function to verify a jwt token and return it's paylod
  async validateToken(token?: string): Promise<User> {
    if (!token) throw new UnauthorizedException('User is not loggedin/found');

    const { error: JwtError, data: payload } = await tryCatch(
      this.jwt.verifyAsync<any>(token, {
        secret: this.configService.get('ACCESS_SECRET'),
      }),
    );

    if (JwtError || !payload.user)
      throw new Error('User is not found in the token');

    const { error, data: user } = await tryCatch(
      this.usersService.getUserByEmail(payload.user.email),
    );
    if (error) throw new UnauthorizedException(error.message);
    if (!user)
      throw new UnauthorizedException('User not found, please signup/signin');

    return payload.user as User;
  }

  async getUserSetting(id: string) {
    return await this.usersService.getUserSetting(id);
  }

  async createUserSettings(userId: string): Promise<UserSetting | null> {
    return await this.usersService.createUserSettings(userId);
  }

  // handle seen functionality

  async notSeen(notSeenDto: UserNotSeenObject) {
    return { seen: await this.usersService.getSeen(notSeenDto) };
  }
  async setSeen(seenObject: UserSeenObject) {
    return { success: await !!this.usersService.addSeen(seenObject) };
  }
}
