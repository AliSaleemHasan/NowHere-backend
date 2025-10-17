import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { mapProtoToEntityDto, mapUserToProto } from './mappers/user-mappers';
import {
  CreateUserDTO,
  ValidateUserDto,
  Settings as ProtoSettingsType,
  SeenObject,
  NotSeenDto,
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

  async createUser(createUserDto: CreateUserDTO) {
    let { error, data } = await tryCatch(
      this.usersService.createUser(mapProtoToEntityDto(createUserDto)),
    );
    if (error) return {};
    return data;
  }
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

    let { error: JwtError, data: payload } = await tryCatch(
      this.jwt.verifyAsync<any>(token, {
        secret: this.configService.get('ACCESS_SECRET'),
      }),
    );

    if (JwtError || !payload.user)
      throw new Error('User is not found in the token');

    let { error, data: user } = await tryCatch(
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

  async createUserSettings(userId: string): Promise<ProtoSettingsType | null> {
    return await this.usersService.createUserSettings(userId);
  }

  // handle seen functionality

  async notSeen(notSeenDto: NotSeenDto) {
    return { seen: await this.usersService.getSeen(notSeenDto) };
  }
  async setSeen(seenObject: SeenObject) {
    return { success: await !!this.usersService.addSeen(seenObject) };
  }
}
