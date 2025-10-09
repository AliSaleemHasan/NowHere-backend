import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateSnapDto } from './dto/create-snap.dto';
import { Snap, SnapStatus, Tags } from './schemas/snap.schema';
import { DeleteResult, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { SnapsGetaway } from '../getaway';
import {
  maxDistance_TO_SEE,
  MIN_DISTANCE_TO_POST,
  SNAP_DISAPPEAR_TIME,
  handleMongoError,
  MICROSERVICES,
  AUTH_GRPC,
  STORAGE_REDIS,
  STORAGE_GRPC,
} from 'nowhere-common';
import {
  AUTH_USERS_SERVICE_NAME,
  authProtoOptions,
  AuthUsersClient,
  AWS_STORAGE_SERVICE_NAME,
  AwsStorageClient,
  Settings,
  storageProtoOptions,
} from 'proto';
import { ClientGrpc, ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { deleteFromFolder } from 'nowhere-common';
import { join } from 'path';
import { SnapUploadedDto } from './dto/snap-uploaded-dto';
import { FindSnapDTO } from './dto/find-snap.dto';

@Injectable()
export class SnapsService implements OnModuleInit {
  private logger: Logger = new Logger(SnapsService.name);
  private authUsersService: AuthUsersClient;
  private storageService: AwsStorageClient;

  constructor(
    @InjectModel(Snap.name) private snapModel: Model<Snap>,
    @Inject(STORAGE_REDIS) private redisClient: ClientProxy,
    @Inject(STORAGE_GRPC) private storageClient: ClientGrpc,
    @Inject(AUTH_GRPC) private client: ClientGrpc,

    private snapsGateaway: SnapsGetaway,
  ) {}

  onModuleInit() {
    this.authUsersService = this.client.getService<AuthUsersClient>(
      AUTH_USERS_SERVICE_NAME,
    );

    this.storageService = this.storageClient.getService<AwsStorageClient>(
      AWS_STORAGE_SERVICE_NAME,
    );
  }

  async handleCreateSnap(data: SnapUploadedDto) {
    // first and formost, snaps are deleted even if error happens (no need to save more data into the server);
    await deleteFromFolder(
      join(__dirname, '..', '..', '..', 'tmp'),
      data.filesNames,
    );

    if (data.error) {
      this.logger.log('Error uploading files!', data.error);
      await this.deleteSnap(data.snapId);

      throw new BadRequestException(data.error);
    }

    let updateStatus = await this.updateSnapImages(data.snapId, data.keys);

    this.logger.log(
      'Snap service added the uploaded keys with upload status: ',
      JSON.stringify(updateStatus),
    );
  }
  async create(
    _userId: string,
    snaps: Array<Express.Multer.File>,
    createSnapDto: CreateSnapDto,
  ) {
    // handle parising the data correctly
    createSnapDto._userId = _userId;

    createSnapDto.snaps = [];

    let location = createSnapDto.location;
    if (typeof location === 'string') location = JSON.parse(location);
    createSnapDto.location = location;

    let params = await this.getNearParams({ _userId });

    console.log(params, location);

    const exists = await this.snapModel
      .findOne({
        _userId,
        createdAt: { $gte: params.showBefore, $lte: params.showAfter },
        location: {
          $near: {
            $geometry: location,
            $maxDistance: params.allowedPostDistance, // meters
          },
        },
      })
      .select('_id')
      .lean() // returns plain object
      .exec();

    if (exists)
      throw new ForbiddenException(
        'User has already posted in this area today!!',
      );

    try {
      // first save the data

      const createdSnap = new this.snapModel({
        ...createSnapDto,
        status: SnapStatus.PROCESSING,
      });

      const created = await createdSnap.save();

      this.redisClient.emit('upload-snap', {
        files: snaps,
        userId: _userId,
        snapId: created.id,
      });

      this.snapsGateaway.handleNewSnap(created);

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
   * @param input _userId here it is used to get user settings
   * @returns (showAfter,showBefore) the time slot to search snaps within, visionDistance: max distance where snaps can be shown and allowedPostDistance: wheather user can post in an area
   */
  async getNearParams(input: { _userId: string }) {
    let user_settings: Settings | null = null;
    // if (!input._userId)
    //   throw new UnauthorizedException('User Token was not provided!');
    if (input._userId)
      user_settings = await firstValueFrom(
        this.authUsersService.getUserSetting({ id: input._userId }),
      );

    let visionDistance = user_settings?.maxDistance || maxDistance_TO_SEE;

    let allowedPostDistance =
      user_settings?.newSnapDistance || MIN_DISTANCE_TO_POST;

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

    return { showAfter, showBefore, visionDistance, allowedPostDistance };
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

  async findNear({
    location,
    tags,
    _userId,
  }: {
    location: [Number, Number];
    tags: Tags[];
    _userId: string;
  }) {
    let params = await this.getNearParams({ _userId });

    return await this.snapModel
      .find({
        ...(tags && tags?.length > 0 && { tag: { $in: tags } }),

        ...(_userId && { _userId }),
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
      let snap = await this.snapModel.findById(id).exec();
      if (!snap) throw new NotFoundException('Snap not found for id: ' + id);

      // now return snap with images Data
      let imageKeys = await firstValueFrom(
        this.storageService.getSignedUrLs({ keys: snap.snaps }),
      );

      // first get seen (to know if it is seen or not)

      let seen = await firstValueFrom(
        this.authUsersService.notSeen({ seen: true, userID }),
      );

      // now set it as seen

      if (!Object.keys(seen).length) {
        let { success } = await firstValueFrom(
          this.authUsersService.setSeen({ snapID: id, userID }),
        );

        if (!success) this.logger.error('Seen is not being set correctly!!');
      }

      return { snap, imageKeys: imageKeys.urls };
    } catch (e) {
      throw new NotFoundException('Snap not found ' + e.message);
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

  // seen functionality

  async getSeenSnaps(
    getSnapDTO: FindSnapDTO,
    userID: string,
    seen: boolean = true,
  ) {
    // first get the near snap (snaps that users can see)

    let nearSnaps = await this.findNear({ ...getSnapDTO, _userId: userID });

    if (!userID) return nearSnaps;

    let seenSnaps: typeof nearSnaps = [];

    for (const snap of nearSnaps) {
      let seenSnap = await firstValueFrom(
        this.authUsersService.notSeen({ userID, seen, snapID: snap.id }),
      );

      if (Object.keys(seenSnap).length > 0) seenSnaps.push(snap);
    }

    return seenSnaps;
  }
}
