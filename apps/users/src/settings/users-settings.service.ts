import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateSettingsPayload } from 'contracts';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Settings } from './entities/settings.entity';

@Injectable()
export class UsersSettingsService {
  constructor(
    @InjectRepository(Settings)
    private readonly settingsRepository: Repository<Settings>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUserSetting(id: string) {
    const userSettings = await this.findSettings(id);
    if (userSettings) {
      return userSettings;
    }

    return this.createUserSettings(id);
  }

  async findSettings(userId: string) {
    const userSettings = await this.settingsRepository.findOne({
      where: { user: { id: userId } },
      relations: { user: true },
    });
    return userSettings ? this.withoutUser(userSettings) : null;
  }

  async updateSettings(payload: UpdateSettingsPayload) {
    const settings = await this.loadOrCreate(payload.userId);
    settings.maxDistance = payload.maxDistance;
    settings.newSnapDistance = payload.newSnapDistance;
    settings.snapDisappearTime = payload.snapDisappearTime;
    const saved = await this.settingsRepository.save(settings);
    return this.withoutUser(saved);
  }

  private async loadOrCreate(userId: string) {
    const existing = await this.settingsRepository.findOne({
      where: { user: { id: userId } },
      relations: { user: true },
    });
    if (existing) return existing;
    return this.createUserSettings(userId);
  }

  private async createUserSettings(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found!');

    const settings = this.settingsRepository.create({ user });
    return this.settingsRepository.save(settings);
  }

  private withoutUser(settings: Settings) {
    return {
      id: settings.id,
      maxDistance: settings.maxDistance,
      newSnapDistance: settings.newSnapDistance,
      snapDisappearTime: settings.snapDisappearTime,
    };
  }
}
