import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersPatterns, NotSeenPayload, SetSeenPayload } from 'contracts';
import { UsersService } from '../users.service';

@Controller()
export class UsersNatsController {
  constructor(private usersService: UsersService) {}

  @MessagePattern(UsersPatterns.GET_SETTINGS)
  async getSettings(@Payload() data: { id: string }) {
    return await this.usersService.getUserSetting(data.id);
  }

  @MessagePattern(UsersPatterns.GET_ALL_USERS_INFO)
  async getAllUsersInfo() {
    const users = await this.usersService.getAllUsers();
    return { users };
  }

  @MessagePattern(UsersPatterns.GET_USER_BY_ID)
  async getUserByIdNats(@Payload() data: { id: string }) {
    return await this.usersService.getUserById(data.id);
  }

  @MessagePattern(UsersPatterns.GET_USER_BY_EMAIL)
  async getUserByEmailNats(@Payload() data: { email: string }) {
    return await this.usersService.getUserByEmail(data.email);
  }

  @MessagePattern(UsersPatterns.NOT_SEEN_SNAPS)
  async notSeenSnaps(@Payload() data: NotSeenPayload) {
    const seen = await this.usersService.getSeen(data);
    return { seen };
  }

  @MessagePattern(UsersPatterns.SET_SEEN_SNAP)
  async setSeenSnap(@Payload() data: SetSeenPayload) {
    const saved = await this.usersService.addSeen(data);
    return { success: !!saved };
  }

  @MessagePattern(UsersPatterns.SET_USER_PHOTO)
  async setUserPhoto(@Payload() data: { image: any; userId: string }) {
    let buffer: Buffer;
    if (Buffer.isBuffer(data.image)) {
      buffer = data.image;
    } else if (typeof data.image === 'object' && data.image?.data) {
      buffer = Buffer.from(data.image.data);
    } else if (typeof data.image === 'string') {
      buffer = Buffer.from(data.image, 'base64');
    } else {
      buffer = Buffer.from(data.image as any);
    }
    return await this.usersService.setUserPhoto(buffer, data.userId);
  }
}
