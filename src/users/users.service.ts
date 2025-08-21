import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Roles, User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDTO } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async createUser(createUserDto: CreateUserDTO) {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async seedAdmin() {
    let email = process.env.ADMIN_EMAIL as string;
    let password = process.env.ADMIN_PASSWORD as string;

    const adminFound = await this.getUserByEmail(email);
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
      first_name: 'admin',
      last_name: 'admin',
    });

    this.logger.log('Admin user created successfuly');
  }
  //   getUsers() just for admin (to be created when adding authorization)

  async getUserById(_id: string) {
    const user = await this.userRepository.findOne({ where: { _id } });
    if (!user) return 'User not found!';
    const { password, ...rest } = user;
    return rest;
  }

  async getUserByEmail(email: string) {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  async getAllUsers() {
    return await this.userRepository.find();
  }

  async setUserPhoto(image: string, _id: string) {
    const user = await this.userRepository.preload({ _id, image });
    if (!user) throw new NotFoundException('User not found');

    const updatedUser = await this.userRepository.save(user);

    // remove sensitive field
    const { password, ...safeUser } = updatedUser;
    return safeUser;
  }
}
