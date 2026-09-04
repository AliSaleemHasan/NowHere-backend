import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSnapPayload } from 'contracts';
import {
  assertSnapImageKeys,
  handleMongoError,
  isMongoDuplicateKey,
} from 'nowhere-common';
import { Snap, SnapStatus } from './schemas/snap.schema';
import { SnapsGateway } from './gateway';
import { addDays, SnapsNearParamsService } from './snaps-near-params';

@Injectable()
export class SnapsCreateService {
  private readonly logger = new Logger(SnapsCreateService.name);

  constructor(
    @InjectModel(Snap.name) private readonly snapModel: Model<Snap>,
    private readonly snapsGateway: SnapsGateway,
    private readonly nearParams: SnapsNearParamsService,
  ) {}

  async create(userId: string, createSnapDto: CreateSnapPayload) {
    let location = createSnapDto.location;
    if (typeof location === 'string') location = JSON.parse(location);

    const snapKeys = Array.isArray(createSnapDto.snaps)
      ? createSnapDto.snaps.filter((k) => typeof k === 'string' && k.length > 0)
      : [];
    assertSnapImageKeys(snapKeys, userId);

    const params = await this.nearParams.load(userId);
    const now = new Date();

    let exists: { _id?: unknown } | null = null;
    try {
      exists = await this.snapModel
        .findOne({
          _userId: userId,
          expiresAt: { $gt: now },
          location: {
            $near: {
              $geometry: location,
              $maxDistance: params.allowedPostDistance,
            },
          },
        })
        .select('_id')
        .lean()
        .exec();
    } catch (geoErr) {
      this.logger.warn(
        `Duplicate-area geo query failed: ${geoErr instanceof Error ? geoErr.message : geoErr}`,
      );
    }

    if (exists) {
      throw new ForbiddenException(
        'User has already posted in this area today!!',
      );
    }

    const expiresAt = addDays(now, params.snapDisappearDays);
    const idempotencyKey = createSnapDto.idempotencyKey;

    try {
      const createdSnap = new this.snapModel({
        ...createSnapDto,
        _userId: userId,
        location,
        snaps: snapKeys,
        status: SnapStatus.SUCCESS,
        expiresAt,
        ...(idempotencyKey ? { idempotencyKey } : {}),
      });

      const created = await createdSnap.save();
      const json = created.toJSON();
      try {
        this.snapsGateway.handleNewSnap(json);
      } catch (broadcastErr) {
        this.logger.warn(
          `snap-added broadcast failed: ${broadcastErr instanceof Error ? broadcastErr.message : broadcastErr}`,
        );
      }
      return json;
    } catch (err) {
      if (idempotencyKey && isMongoDuplicateKey(err, 'idempotencyKey')) {
        const existing = await this.snapModel
          .findOne({ _userId: userId, idempotencyKey })
          .exec();
        if (existing) {
          return typeof existing.toJSON === 'function'
            ? existing.toJSON()
            : existing;
        }
      }
      handleMongoError(err);
    }
  }
}
