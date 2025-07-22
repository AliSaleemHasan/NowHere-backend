import { Injectable } from '@nestjs/common';
import { CreateSnapDto } from './dto/create-snap.dto';
import { Snap } from './schemas/snap.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
// import { UpdateSnapDto } from './dto/update-snap.dto';

@Injectable()
export class SnapsService {
  constructor(@InjectModel(Snap.name) private snapModel: Model<Snap>) {}

  create(createSnapDto: CreateSnapDto) {
    const createdSnap = new this.snapModel(createSnapDto);
    return createdSnap.save();
  }

  findAll() {
    return this.snapModel.find();
  }

  findOne(id: string) {
    return this.snapModel.findById(id).exec();
  }

  // update(id: number, updateSnapDto: UpdateSnapDto) {
  //   return `This action updates a #${id} snap`;
  // }

  remove(id: number) {
    return 'removed';
  }
}
