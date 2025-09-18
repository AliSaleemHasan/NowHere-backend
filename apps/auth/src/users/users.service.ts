import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
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
}
