import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { CreateSnapDto } from './dto/create-snap.dto';
import { Snap, Tags } from './schemas/snap.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { SnapsGetaway } from '../getaway';
import { handleMongoError } from 'common/utils/handle-mongoose-errors';
import { ConfigService } from '@nestjs/config';
import { SnapSettings } from '../settings/schemas/settings.schema';
import {
  MAX_DISTANCE_TO_SEE,
  MIN_DISTANCE_TO_POST,
  SNAP_DISAPPEAR_TIME,
} from 'common/constants/settings';
import { SettingsService } from '../settings/settings.service';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class SnapsService {
  private logger: Logger = new Logger(SnapsService.name);
  constructor(
    @InjectModel(Snap.name) private snapModel: Model<Snap>,
    private settingsService: SettingsService,
    private storageServie: StorageService,
    private snapsGateaway: SnapsGetaway,
  ) {}

  async create(
    id: string,
    snaps: Array<Express.Multer.File>,
    createSnapDto: CreateSnapDto,
  ) {
    // handle parising the data correctly
    createSnapDto._userId = id;

    try {
      createSnapDto.snaps = await Promise.all(
        snaps.map((snap) =>
          this.storageServie.uploadFile(snap.buffer, snap.originalname, id),
        ),
      );
    } catch (e) {
      this.logger.error(e.message);
    }

    let location = createSnapDto.location;
    if (typeof location === 'string') location = JSON.parse(location);
    createSnapDto.location = location;

    const alreadyHasPostedNear = await this.findNear(
      location.coordinates,
      Object.values(Tags),
      id,
      true,
    );
    if (alreadyHasPostedNear.length > 0)
      throw new ForbiddenException(
        'User has already posted in this area today!!',
      );

    try {
      // first save the data

      const createdSnap = new this.snapModel(createSnapDto);
      const created = await createdSnap.save();

      await this.snapsGateaway.handleNewSnap(created);
      return created;
    } catch (err) {
      handleMongoError(err);
    }
    // emit the data after saving
  }

  findAll() {
    return this.snapModel.find();
  }

  /**
   *
   * @param location Location to find sanp near it [Long,Lat]
   * @param tags Search Location Near based on tag or Array<Tags>
   * @param _userId imporant internally to get user settings
   * @param canPost To check if the user has already posted in the allowed regeion
   * @param maxDistanceInMeters  Visibilty range of each user
   * @param minPostDistance  Post range ability
   * @returns a list of snaps if found
   */

  async findNear(
    location: [number, number],
    tags: Tags[],
    _userId?: string,
    canPost?: boolean, // to check if the user is trying to post snap in the same region
  ) {
    // first get the seeting of the user
    let user_settings: SnapSettings | null;
    user_settings = await this.settingsService.getUserSetting(_userId);

    let distance = user_settings?.max_distance || MAX_DISTANCE_TO_SEE;

    if (canPost) distance = user_settings?.max_distance || MIN_DISTANCE_TO_POST;

    const queryTime = new Date();

    // multiplier in days
    const days = user_settings?.snapDisappearTime || SNAP_DISAPPEAR_TIME;

    // one day (or N days) before
    const showBefore = new Date(
      queryTime.getTime() - days * 24 * 60 * 60 * 1000,
    );

    // one day (or N days) after
    const showAfter = new Date(
      queryTime.getTime() + days * 24 * 60 * 60 * 1000,
    );

    return await this.snapModel
      .find({
        ...(tags && tags?.length > 0 && { tag: { $in: tags } }),

        ...(_userId && { _userId }),
        createdAt: { $gte: showBefore, $lte: showAfter },
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: location,
            },
            $maxDistance: distance,
          },
        },
      })
      .exec();
  }

  findOne(id: string) {
    return this.snapModel.findById(id).exec();
  }

  findByTags(tags: Tags[] = [Tags.SOCIAL]) {
    return this.snapModel.find({ tag: { $in: tags } }).exec();
  }

  deleteAll() {
    return this.snapModel.deleteMany({});
  }
}
