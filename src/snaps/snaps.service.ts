import { HttpException, Injectable } from '@nestjs/common';
import { CreateSnapDto } from './dto/create-snap.dto';
import { Snap, SnapDocument } from './schemas/snap.schema';
import { FilterQuery, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { SnapsGetaway } from './getaway';
import { handleMongoError } from 'common/utils/handle-mongoose-errors';
// import { UpdateSnapDto } from './dto/update-snap.dto';

@Injectable()
export class SnapsService {
  constructor(
    @InjectModel(Snap.name) private snapModel: Model<Snap>,
    private snapsGateaway: SnapsGetaway,
  ) {}

  async create(
    id: string,
    snaps: Array<Express.Multer.File>,
    createSnapDto: CreateSnapDto,
  ) {
    // handle parising the data correctly
    createSnapDto._userId = id;
    createSnapDto.snaps = snaps.map((snap) => snap.path);

    let location = createSnapDto.location;
    if (typeof location === 'string') location = JSON.parse(location);
    createSnapDto.location = location;

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

    maxDistanceInMeters: number = 20000,
  ) {
    return await this.snapModel.find({
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
