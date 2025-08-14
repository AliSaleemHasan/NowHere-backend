import { Injectable } from '@nestjs/common';
import { SnapSettings } from './schemas/settings.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(SnapSettings.name) private settingsModel: Model<SnapSettings>,
  ) {}

  // first getting the setting of the user

  async getUserSetting(id: string) {
    console.log(id);
    // first check if the user settings are saved

    const userSettings = await this.settingsModel.findOne({ _userId: id });
    if (userSettings) return userSettings;

    return this.createUserSettings(id);

    // create user settings
  }

  async createUserSettings(userId: string) {
    let settings = await this.settingsModel.create({ _userId: userId });
    return settings.save();
  }
}
