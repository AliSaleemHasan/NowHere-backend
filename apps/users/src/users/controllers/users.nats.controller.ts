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
  BookmarkPayloadSchema,
  ListBookmarksSchema,
  CreateReportSchema,
  ExportUserSchema,
  PurgeUserSchema,
  validateSchema,
} from 'contracts';
import { toBuffer } from 'nowhere-common';
import { UsersSettingsService } from '../../settings/users-settings.service';
import { UsersProfileService } from '../users-profile.service';
import { UsersService } from '../users.service';
import { BookmarksService } from '../bookmarks.service';
import { ReportsService } from '../reports.service';
import { UsersExportService } from '../users-export.service';
import { UsersPurgeService } from '../users-purge.service';

@Controller()
export class UsersNatsController {
  constructor(
    private usersService: UsersService,
    private usersProfile: UsersProfileService,
    private usersSettings: UsersSettingsService,
    private bookmarksService: BookmarksService,
    private reportsService: ReportsService,
    private usersExport: UsersExportService,
    private usersPurge: UsersPurgeService,
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

  @MessagePattern(UsersPatterns.ADD_BOOKMARK)
  async addBookmark(@Payload() data: unknown) {
    const payload = validateSchema(BookmarkPayloadSchema, data);
    return await this.bookmarksService.addBookmark(
      payload.userId,
      payload.snapId,
    );
  }

  @MessagePattern(UsersPatterns.REMOVE_BOOKMARK)
  async removeBookmark(@Payload() data: unknown) {
    const payload = validateSchema(BookmarkPayloadSchema, data);
    return await this.bookmarksService.removeBookmark(
      payload.userId,
      payload.snapId,
    );
  }

  @MessagePattern(UsersPatterns.LIST_BOOKMARKS)
  async listBookmarks(@Payload() data: unknown) {
    const payload = validateSchema(ListBookmarksSchema, data);
    const bookmarks = await this.bookmarksService.listBookmarks(payload.userId);
    return { bookmarks };
  }

  @MessagePattern(UsersPatterns.CREATE_REPORT)
  async createReport(@Payload() data: unknown) {
    const payload = validateSchema(CreateReportSchema, data);
    return await this.reportsService.createReport(payload);
  }

  @MessagePattern(UsersPatterns.EXPORT_USER)
  async exportUser(@Payload() data: unknown) {
    const payload = validateSchema(ExportUserSchema, data);
    return await this.usersExport.exportUser(payload);
  }

  @MessagePattern(UsersPatterns.PURGE_USER)
  async purgeUser(@Payload() data: unknown) {
    const payload = validateSchema(PurgeUserSchema, data);
    return await this.usersPurge.purgeUser(payload);
  }
}
