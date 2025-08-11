import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDTO } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async createUser(createUserDto: CreateUserDTO) {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  //   getUsers() just for admin (to be created when adding authorization)

  async getUserById(_id: number) {
    return await this.userRepository.find({ where: { _id } });
  }

  async getUserByEmail(email: string) {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  async getAllUsers() {
    return await this.userRepository.find();
  }
}
