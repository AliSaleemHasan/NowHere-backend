import { Module } from '@nestjs/common';
import { SnapsService } from './snaps/snaps.service';
import { SnapsController } from './snaps/snaps.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Snap, SnapSchema } from './snaps/schemas/snap.schema';
import { SnapsGetaway } from './getaway';
import { SettingsController } from './settings/settings.controller';
import { SettingsService } from './settings/settings.service';
import {
  SnapSettings,
  SnapSettingsSchema,
} from './settings/schemas/settings.schema';
import { StorageService } from '../storage/storage.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Snap.name, schema: SnapSchema },
      { name: SnapSettings.name, schema: SnapSettingsSchema },
    ]),
  ],
  controllers: [SnapsController, SettingsController],
  providers: [SnapsService, SnapsGetaway, SettingsService, StorageService],
  exports: [SettingsService],
})
export class SnapsModule {}
