import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Settings } from '../settings/entities/settings.entity';
import { SnapSeen } from './entities/snaps-seen.entity';
import { SnapBookmark } from './entities/snap-bookmark.entity';
import { SnapReport } from './entities/snap-report.entity';
import { UsersNatsController } from './controllers/users.nats.controller';
import { UsersEventsHandler } from './controllers/users-events-handler';
import { BookmarksService } from './bookmarks.service';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Settings,
      SnapSeen,
      SnapBookmark,
      SnapReport,
    ]),
  ],
  providers: [
    UsersService,
    BookmarksService,
    ReportsService,
    UsersEventsHandler,
  ],
  controllers: [UsersNatsController],
  exports: [UsersService],
})
export class UsersModule {}
