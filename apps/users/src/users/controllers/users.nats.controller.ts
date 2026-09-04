import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  UsersPatterns,
  NotSeenPayload,
  SetSeenPayload,
  NotSeenSchema,
  SetSeenSchema,
  UserIdPayloadSchema,
  EmailPayloadSchema,
  UpdateProfileSchema,
  UpdateSettingsSchema,
  validateSchema,
} from 'contracts';
import { toBuffer } from 'nowhere-common';
import { UsersSettingsService } from '../../settings/users-settings.service';
import { UsersProfileService } from '../users-profile.service';
import { UsersService } from '../users.service';

@Controller()
export class UsersNatsController {
  constructor(
    private usersService: UsersService,
    private usersProfile: UsersProfileService,
    private usersSettings: UsersSettingsService,
  ) {}

  @MessagePattern(UsersPatterns.GET_SETTINGS)
  async getSettings(@Payload() data: { id: string }) {
    const payload = validateSchema(UserIdPayloadSchema, data);
    return await this.usersSettings.getUserSetting(payload.id);
  }

  @MessagePattern(UsersPatterns.UPDATE_PROFILE)
  async updateProfile(@Payload() data: unknown) {
    const payload = validateSchema(UpdateProfileSchema, data);
    return await this.usersProfile.updateProfile(payload);
  }

  @MessagePattern(UsersPatterns.UPDATE_SETTINGS)
  async updateSettings(@Payload() data: unknown) {
    const payload = validateSchema(UpdateSettingsSchema, data);
    return await this.usersSettings.updateSettings(payload);
  }

  @MessagePattern(UsersPatterns.GET_ALL_USERS_INFO)
  async getAllUsersInfo() {
    const users = await this.usersService.getAllUsers();
    return { users };
  }

  @MessagePattern(UsersPatterns.GET_USER_BY_ID)
  async getUserByIdNats(@Payload() data: { id: string }) {
    const payload = validateSchema(UserIdPayloadSchema, data);
    return await this.usersService.getUserWithImage(payload.id);
  }

  @MessagePattern(UsersPatterns.GET_USER_BY_EMAIL)
  async getUserByEmailNats(@Payload() data: { email: string }) {
    const payload = validateSchema(EmailPayloadSchema, data);
    return await this.usersService.getUserByEmail(payload.email);
  }

  @MessagePattern(UsersPatterns.NOT_SEEN_SNAPS)
  async notSeenSnaps(@Payload() data: NotSeenPayload) {
    const payload = validateSchema(NotSeenSchema, data);
    const seen = await this.usersService.getSeen(payload);
    return { seen };
  }

  @MessagePattern(UsersPatterns.SET_SEEN_SNAP)
  async setSeenSnap(@Payload() data: SetSeenPayload) {
    const payload = validateSchema(SetSeenSchema, data);
    const saved = await this.usersService.addSeen(payload);
    return { success: !!saved };
  }

  @MessagePattern(UsersPatterns.SET_USER_PHOTO)
  async setUserPhoto(@Payload() data: { image: unknown; userId: string }) {
    return await this.usersService.setUserPhoto(
      toBuffer(data.image),
      data.userId,
    );
  }
}
