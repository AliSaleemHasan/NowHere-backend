import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Snap, SnapStatus } from './schemas/snap.schema';
import { DeleteResult, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { SnapsGateway } from './gateway';
import {
  maxDistance_TO_SEE,
  MIN_DISTANCE_TO_POST,
  SNAP_DISAPPEAR_TIME,
  handleMongoError,
  natsRequest,
  assertSnapImageKeys,
} from 'nowhere-common';
import { ClientProxy } from '@nestjs/microservices';
import {
  StoragePatterns,
  UsersPatterns,
  SignedUrlsPayload,
  UserSettingsDto,
  SeenObjectsDto,
} from 'contracts';
import { FindSnapDTO } from 'nowhere-common/dto/snaps/find-snap.dto';
import { CreateSnapDto } from 'nowhere-common/dto/snaps/create-snap.dto';
import { Tags } from 'nowhere-common/types/common-types';

@Injectable()
export class SnapsService {
  private logger: Logger = new Logger(SnapsService.name);

  constructor(
    @InjectModel(Snap.name) private snapModel: Model<Snap>,
    @Inject('NATS_CLIENT') private natsClient: ClientProxy,
    private snapsGateaway: SnapsGateway,
  ) {}

  async create(userId: string, createSnapDto: CreateSnapDto) {
    createSnapDto._userId = userId;

    let location = createSnapDto.location;
    if (typeof location === 'string') location = JSON.parse(location);
    createSnapDto.location = location;

    const snapKeys = Array.isArray(createSnapDto.snaps)
      ? createSnapDto.snaps.filter((k) => typeof k === 'string' && k.length > 0)
      : [];
    assertSnapImageKeys(snapKeys, userId);
    createSnapDto.snaps = snapKeys;

    const params = await this.getNearParams({ _userId: userId });

    const exists = await this.snapModel
      .findOne({
        _userId: userId,
        createdAt: { $gte: params.showBefore, $lte: params.showAfter },
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

    if (exists)
      throw new ForbiddenException(
        'User has already posted in this area today!!',
      );

    try {
      const createdSnap = new this.snapModel({
        ...createSnapDto,
        status: SnapStatus.SUCCESS,
      });

      const created = await createdSnap.save();
      this.snapsGateaway.handleNewSnap(created);
      return created;
    } catch (err) {
      handleMongoError(err);
    }
  }

  findAll() {
    return this.snapModel.find();
  }

  async getNearParams(input: { _userId: string }) {
    let user_settings: UserSettingsDto | null = null;
    if (input._userId) {
      try {
        user_settings = await natsRequest<UserSettingsDto, { id: string }>(
          this.natsClient,
          UsersPatterns.GET_SETTINGS,
          { id: input._userId },
        );
      } catch (err) {
        this.logger.warn(
          `Failed to fetch user settings for ${input._userId}: ${err?.message}`,
        );
      }
    }

    const visionDistance = user_settings?.maxDistance || maxDistance_TO_SEE;
    const allowedPostDistance =
      user_settings?.newSnapDistance || MIN_DISTANCE_TO_POST;

    const queryTime = new Date();
    const days = user_settings?.snapDisappearTime || SNAP_DISAPPEAR_TIME;

    const showBefore = new Date(
      queryTime.getTime() - days * 24 * 60 * 60 * 1000,
    );
    const showAfter = new Date(
      queryTime.getTime() + days * 24 * 60 * 60 * 1000,
    );

    return { showAfter, showBefore, visionDistance, allowedPostDistance };
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
    const params = await this.getNearParams({ _userId });

    return await this.snapModel
      .find({
        status: SnapStatus.SUCCESS,
        ...(tags && tags.length > 0 && { tag: { $in: tags } }),
        createdAt: { $gte: params.showBefore, $lte: params.showAfter },
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: location,
            },
            $maxDistance: params.visionDistance,
          },
        },
      })
      .exec();
  }

  async updateSnapImages(id: string, images: string[]) {
    return await this.snapModel.findOneAndUpdate(
      { _id: id },
      {
        snaps: images,
        status: SnapStatus.SUCCESS,
      },
      { new: true },
    );
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
      throw new NotFoundException('Snap not found: ' + e.message);
    }
  }

  findByTags(tags: Tags[] = [Tags.SOCIAL]) {
    return this.snapModel.find({ tag: { $in: tags } }).exec();
  }

  deleteSnap(Id: string): Promise<DeleteResult> {
    return this.snapModel.deleteOne({ _id: Id });
  }

  deleteAll(): Promise<DeleteResult> {
    return this.snapModel.deleteMany({});
  }

  async getSeenSnaps(
    getSnapDTO: FindSnapDTO,
    userID: string,
    seen: boolean = true,
  ) {
    const nearSnaps = await this.findNear({ ...getSnapDTO, _userId: userID });

    if (!userID || nearSnaps.length === 0) return nearSnaps;

    const snapIds = nearSnaps.map((s) => s.id);

    const response = await natsRequest<
      SeenObjectsDto,
      { seen: boolean; userId: string; snapIds: string[] }
    >(this.natsClient, UsersPatterns.NOT_SEEN_SNAPS, {
      userId: userID,
      seen: true,
      snapIds,
    });

    const seenSnapIdsSet = new Set((response?.seen || []).map((s) => s.snapId));
    return nearSnaps.filter((snap) =>
      seen ? seenSnapIdsSet.has(snap.id) : !seenSnapIdsSet.has(snap.id),
    );
  }
}
