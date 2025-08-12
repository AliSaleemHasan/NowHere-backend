import {
  ForbiddenException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateSnapDto } from './dto/create-snap.dto';
import { Snap, SnapDocument } from './schemas/snap.schema';
import { FilterQuery, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { SnapsGetaway } from './getaway';
import { handleMongoError } from 'common/utils/handle-mongoose-errors';
import { ConfigService } from '@nestjs/config';
// import { UpdateSnapDto } from './dto/update-snap.dto';

@Injectable()
export class SnapsService {
  constructor(
    @InjectModel(Snap.name) private snapModel: Model<Snap>,
    private snapsGateaway: SnapsGetaway,
    private configService: ConfigService,
  ) {}

  async create(
    id: string,
    snaps: Array<Express.Multer.File>,
    createSnapDto: CreateSnapDto,
  ) {
    // handle parising the data correctly
    createSnapDto._userId = id;
    createSnapDto.snaps = snaps.map((snap) => snap.path);

    // check if user has already posted a snap in the same area

    let location = createSnapDto.location;
    if (typeof location === 'string') location = JSON.parse(location);
    createSnapDto.location = location;

    const alreadyHasPostedNear = await this.findNear(location.coordinates, id);
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

  async findNear(
    location: [number, number],
    _userId?: string,
    maxDistanceInMeters: number = this.configService.get('MAX_DISTANCE_NEAR') ||
      20000,
  ) {
    return await this.snapModel.find({
      ...(_userId && { _userId }),
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: location,
          },
          $maxDistance: maxDistanceInMeters,
        },
      },
    });
  }

  findOne(id: string) {
    return this.snapModel.findById(id).exec();
  }

  deleteAll() {
    return this.snapModel.deleteMany({});
  }
}
