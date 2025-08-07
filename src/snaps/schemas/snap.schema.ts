import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SnapDocument = HydratedDocument<Snap>;

@Schema({ timestamps: true }) // auto-adds createdAt and updatedAt
export class Snap {
  @Prop({ required: true })
  description: string;

  @Prop({
    type: [String],
    required: true,
    validate: [(val: string[]) => val.length <= 4, 'Maximum 4 images allowed'],
  })
  snaps: string[];

  @Prop({ required: true })
  _userId: string;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  })
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export const SnapSchema = SchemaFactory.createForClass(Snap);
