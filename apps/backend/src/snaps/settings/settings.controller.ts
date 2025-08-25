import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReqUser } from 'common/decorators/user.decorator';
import { JwtGuard } from 'common/guards/jwt-guard';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}
  @Get('')
  @UseGuards(JwtGuard)
  getUserSettings(@ReqUser('_id') id: string) {
    return this.settingsService.getUserSetting(id);
  }
}
