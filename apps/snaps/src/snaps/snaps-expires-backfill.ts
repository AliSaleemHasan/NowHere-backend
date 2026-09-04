import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Snap } from './schemas/snap.schema';
import { MS_PER_DAY } from './snaps-near-params';

@Injectable()
export class SnapsExpiresBackfill implements OnModuleInit {
  private readonly logger = new Logger(SnapsExpiresBackfill.name);

  constructor(
    @InjectModel(Snap.name) private readonly snapModel: Model<Snap>,
  ) {}

  async onModuleInit(): Promise<void> {
    const result = await this.snapModel.updateMany(
      {
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }],
      },
      [
        {
          $set: {
            expiresAt: { $add: ['$createdAt', MS_PER_DAY] },
          },
        },
      ],
    );
    if (result.modifiedCount > 0) {
      this.logger.log(`Backfilled expiresAt on ${result.modifiedCount} snaps`);
    }
  }
}
