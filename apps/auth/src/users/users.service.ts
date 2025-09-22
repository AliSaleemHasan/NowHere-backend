import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Roles, User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDTO } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { Settings } from '../settings/entities/settings.entity';
import { mapUserToProto } from '../grpc/mappers/user-mappers';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Settings)
    private settingsRepository: Repository<Settings>,
  ) {}

  async createUser(createUserDto: CreateUserDTO) {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async seedAdmin() {
    let email = process.env.ADMIN_EMAIL as string;
    let password = process.env.ADMIN_PASSWORD as string;

    let adminFound;

    try {
      adminFound = await this.getUserByEmail(email);
    } catch (e) {
      console.log(e.message);
    }

    if (adminFound) {
      this.logger.log('Admin user already exists, skipping seeding.');
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await this.createUser({
      bio: '',
      email,
      password: hashedPassword,
      role: Roles.ADMIN,
      firstName: 'admin',
      lastName: 'admin',
    });

    this.logger.log('Admin user created successfuly');
  }
  //   getUsers() just for admin (to be created when adding authorization)

  async getUserById(Id: string) {
    const user = await this.userRepository.findOne({ where: { Id } });
    if (!user) return 'User not found!';
    const { password, ...rest } = user;
    return rest;
  }

  async getUserByEmail(email: string) {
    try {
      return await this.userRepository.findOneOrFail({
        where: { email },
      });
    } catch (e) {
      throw new NotFoundException('No user found with this email!');
    }
  }

  async getAllUsers() {
    return await this.userRepository.find();
  }

  async setUserPhoto(image: string, Id: string) {
    const user = await this.userRepository.preload({ Id, image });
    if (!user) throw new NotFoundException('User not found');

    const updatedUser = await this.userRepository.save(user);

    // remove sensitive field
    const { password, ...safeUser } = updatedUser;
    return safeUser;
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

  async createUserSettings(userId: string) {
    const user = await this.getUserById(userId);

    if (user === 'User not found!') return null;
    const settings = this.settingsRepository.create({
      user,
    });

    return await this.settingsRepository.save(settings);
  }
}
