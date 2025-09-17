import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
// import { JWTPayload } from 'types/jwt-payload.type';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Settings } from '../settings/entities/settings.entity';
import { mapProtoToEntityDto, mapUserToProto } from './mappers/user-mappers';
import { mapSettingstoProto } from './mappers/settings-mapper';
import {
  CreateUserDTO,
  ValidateUserDto,
  Settings as ProtoSettingsType,
} from 'proto';

@Injectable()
export class GrpcService {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
    private jwt: JwtService,
    @InjectRepository(Settings)
    private settingsRepository: Repository<Settings>,
  ) {}

  async getAllUsers() {
    return await this.usersService.getAllUsers();
  }

  async createUser(createUserDto: CreateUserDTO) {
    try {
      return this.usersService.createUser(mapProtoToEntityDto(createUserDto));
    } catch (e) {
      return {};
    }
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
    try {
      const payload = await this.jwt.verifyAsync<any>(token, {
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

  async getUserSetting(id: string) {
    const userSettings = await this.settingsRepository.findOne({
      where: { user: { Id: id } },
      relations: { user: true },
    });

    if (userSettings) {
      let { user, ...settings } = userSettings;
      return { ...settings };
    }

    return this.createUserSettings(id);

    // create user settings
  }

  async createUserSettings(userId: string): Promise<ProtoSettingsType | null> {
    const user = await this.usersService.getUserById(userId);

    if (user === 'User not found!') return null;
    const settings = this.settingsRepository.create({
      user: mapUserToProto(user),
    });

    return mapSettingstoProto(await this.settingsRepository.save(settings));
  }
}
