import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  UsersPatterns,
  AuthPatterns,
  UserCredentialsCreatedEvent,
  CreateUserInfoPayload,
} from 'contracts';
import { UsersService } from '../users.service';

@Controller()
export class UsersEventsController {
  constructor(private usersService: UsersService) {}

  @MessagePattern(AuthPatterns.USER_CREDENTIALS_CREATED)
  async handleUserCreated(@Payload() data: UserCredentialsCreatedEvent) {
    await this.usersService.createUser({
      id: data.authId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      bio: '',
    });
  }

  @MessagePattern(UsersPatterns.CREATE_USER_INFO)
  async createUserInfo(@Payload() data: CreateUserInfoPayload) {
    return await this.usersService.createUser({
      id: data.authId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      bio: data.bio || '',
    });
  }
}
