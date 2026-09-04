import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Settings } from '../settings/entities/settings.entity';
import { SnapSeen } from './entities/snaps-seen.entity';
import { UsersNatsController } from './controllers/users.nats.controller';
import { UsersEventsHandler } from './controllers/users-events-handler';
import { UsersProfileService } from './users-profile.service';
import { UsersSettingsService } from '../settings/users-settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Settings, SnapSeen])],
  providers: [
    UsersService,
    UsersProfileService,
    UsersSettingsService,
    UsersEventsHandler,
  ],
  controllers: [UsersNatsController],
  exports: [UsersService],
})
export class UsersModule {}
