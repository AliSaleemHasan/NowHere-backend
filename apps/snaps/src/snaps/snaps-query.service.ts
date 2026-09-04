import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { Model } from 'mongoose';
import {
  SeenObjectsDto,
  SignedUrlsPayload,
  StoragePatterns,
  UsersPatterns,
} from 'contracts';
import {
  NATS_CLIENT,
  metersToSphereRadians,
  natsRequest,
  Tags,
} from 'nowhere-common';
import { Snap } from './schemas/snap.schema';
import { SnapsNearParamsService } from './snaps-near-params';
import { activeSnapFilter, ownedSnapsFilter } from './snaps-query.helpers';

@Injectable()
export class SnapsQueryService {
  private readonly logger = new Logger(SnapsQueryService.name);

  constructor(
    @InjectModel(Snap.name) private readonly snapModel: Model<Snap>,
    @Inject(NATS_CLIENT) private readonly natsClient: ClientProxy,
    private readonly nearParams: SnapsNearParamsService,
  ) {}

  findAll() {
    return this.snapModel.find();
  }

  findByTags(tags: Tags[] = [Tags.SOCIAL]) {
    return this.snapModel.find({ tag: { $in: tags } }).exec();
  }

  findByUser(userId: string, includeExpired = true) {
    return this.snapModel
      .find(ownedSnapsFilter(userId, includeExpired, new Date()))
      .exec();
  }

  async findNear({
    location,
    tags,
    _userId,
  }: {
    location: [number, number];
    tags?: Tags[];
    _userId: string;
  }) {
    const params = await this.nearParams.load(_userId);
    const radiusRadians = metersToSphereRadians(params.visionDistance);
    const filters = activeSnapFilter(new Date(), tags);

    try {
      return await this.snapModel
        .find({
          ...filters,
          location: {
            $geoWithin: {
              $centerSphere: [location, radiusRadians],
            },
          },
        })
        .exec();
    } catch (geoErr) {
      this.logger.warn(
        `findNear geo query failed: ${geoErr instanceof Error ? geoErr.message : geoErr}`,
      );
      try {
        return await this.snapModel
          .find({
            ...filters,
            location: {
              $near: {
                $geometry: { type: 'Point', coordinates: location },
                $maxDistance: params.visionDistance,
              },
            },
          })
          .exec();
      } catch (nearErr) {
        this.logger.warn(
          `findNear $near fallback failed: ${nearErr instanceof Error ? nearErr.message : nearErr}`,
        );
        return [];
      }
    }
  }

  async findOne(id: string, userID: string) {
    try {
      const snap = await this.snapModel.findById(id).exec();
      if (!snap) throw new NotFoundException('Snap not found for id: ' + id);

      let signedUrls: string[] = [];
      if (snap.snaps && snap.snaps.length > 0) {
        const imageKeys = await natsRequest<
          { urls: string[] },
          SignedUrlsPayload
        >(this.natsClient, StoragePatterns.GET_SIGNED_URLS, {
          keys: snap.snaps,
        });
        signedUrls = imageKeys?.urls || [];
      }

      if (userID) {
        const seenResponse = await natsRequest<
          SeenObjectsDto,
          { seen: boolean; userId: string; snapIds: string[] }
        >(this.natsClient, UsersPatterns.NOT_SEEN_SNAPS, {
          seen: true,
          userId: userID,
          snapIds: [id],
        });

        if (!seenResponse?.seen || seenResponse.seen.length === 0) {
          await natsRequest<
            { success: boolean },
            { snapId: string; userId: string }
          >(this.natsClient, UsersPatterns.SET_SEEN_SNAP, {
            snapId: id,
            userId: userID,
          });
        }
      }

      return { snap, imageKeys: signedUrls };
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      throw new NotFoundException(
        'Snap not found: ' + (e instanceof Error ? e.message : e),
      );
    }
  }

  async getSeenSnaps(
    query: { tags?: Tags[]; location: [number, number] },
    userID: string,
    seen: boolean = true,
  ) {
    const nearSnaps = await this.findNear({ ...query, _userId: userID });

    if (!userID || nearSnaps.length === 0) return nearSnaps;

    const idOf = (snap: { id?: string; _id?: unknown }) =>
      snap.id || (snap._id ? String(snap._id) : '');

    const snapIds = nearSnaps.map(idOf).filter(Boolean);

    const response = await natsRequest<
      SeenObjectsDto,
      { seen: boolean; userId: string; snapIds: string[] }
    >(this.natsClient, UsersPatterns.NOT_SEEN_SNAPS, {
      userId: userID,
      seen: true,
      snapIds,
    });

    const seenSnapIdsSet = new Set((response?.seen || []).map((s) => s.snapId));
    return nearSnaps.filter((snap) => {
      const id = idOf(snap);
      return seen ? seenSnapIdsSet.has(id) : !seenSnapIdsSet.has(id);
    });
  }
}
