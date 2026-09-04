import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateProfilePayload } from 'contracts';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersProfileService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async updateProfile(payload: UpdateProfilePayload) {
    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
    });
    if (!user) throw new NotFoundException('User not found!');

    if (payload.firstName !== undefined) user.firstName = payload.firstName;
    if (payload.lastName !== undefined) user.lastName = payload.lastName;
    if (payload.bio !== undefined) user.bio = payload.bio;

    return this.userRepository.save(user);
  }
}
