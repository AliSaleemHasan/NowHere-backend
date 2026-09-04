import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { Model } from 'mongoose';
import { StoragePatterns } from 'contracts';
import { NATS_CLIENT, natsRequest } from 'nowhere-common';
import { Snap } from './schemas/snap.schema';

const TTL_BATCH_SIZE = 100;
const TTL_CRON = '0 */15 * * * *';

@Injectable()
export class SnapsTtlService {
  private readonly logger = new Logger(SnapsTtlService.name);

  constructor(
    @InjectModel(Snap.name) private readonly snapModel: Model<Snap>,
    @Inject(NATS_CLIENT) private readonly natsClient: ClientProxy,
  ) {}

  @Cron(TTL_CRON)
  async handleExpiredSnaps(): Promise<void> {
    await this.sweepExpired();
  }

  async sweepExpired(now = new Date()): Promise<number> {
    const docs = await this.snapModel
      .find({ expiresAt: { $lte: now } })
      .select('_id snaps')
      .limit(TTL_BATCH_SIZE)
      .lean()
      .exec();

    if (docs.length === 0) {
      return 0;
    }

    const keys = [
      ...new Set(
        docs
          .flatMap((doc) => doc.snaps || [])
          .filter((key) => typeof key === 'string' && key.length > 0),
      ),
    ];
    if (keys.length > 0) {
      await natsRequest<void, { keys: string[] }>(
        this.natsClient,
        StoragePatterns.DELETE_FILES,
        { keys },
      );
    }

    await this.snapModel.deleteMany({
      _id: { $in: docs.map((doc) => doc._id) },
    });
    this.logger.log(`TTL deleted ${docs.length} expired snaps`);
    return docs.length;
  }
}
