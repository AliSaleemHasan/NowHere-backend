import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { PurgeUserPayload, StoragePatterns } from 'contracts';
import { NATS_CLIENT, natsRequest } from 'nowhere-common';
import { Repository } from 'typeorm';
import { SnapBookmark } from './entities/snap-bookmark.entity';
import { SnapReport } from './entities/snap-report.entity';
import { SnapSeen } from './entities/snaps-seen.entity';
import { User } from './entities/user.entity';
import { Settings } from '../settings/entities/settings.entity';

@Injectable()
export class UsersPurgeService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Settings)
    private readonly settingsRepository: Repository<Settings>,
    @InjectRepository(SnapSeen)
    private readonly snapSeenRepo: Repository<SnapSeen>,
    @InjectRepository(SnapBookmark)
    private readonly bookmarkRepo: Repository<SnapBookmark>,
    @InjectRepository(SnapReport)
    private readonly reportRepo: Repository<SnapReport>,
    @Inject(NATS_CLIENT) private readonly natsClient: ClientProxy,
  ) {}

  async purgeUser(payload: PurgeUserPayload): Promise<{ success: true }> {
    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
    });

    if (user?.image) {
      await natsRequest<void, { keys: string[] }>(
        this.natsClient,
        StoragePatterns.DELETE_FILES,
        { keys: [user.image] },
      );
    }

    await this.snapSeenRepo.delete({ userId: payload.userId });
    await this.bookmarkRepo.delete({ userId: payload.userId });
    await this.reportRepo.delete({ userId: payload.userId });

    const settings = await this.settingsRepository.findOne({
      where: { user: { id: payload.userId } },
    });
    if (settings) {
      await this.settingsRepository.remove(settings);
    }

    if (user) {
      await this.userRepository.remove(user);
    }

    return { success: true };
  }
}
