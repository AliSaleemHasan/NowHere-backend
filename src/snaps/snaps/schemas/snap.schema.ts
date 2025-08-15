import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SnapDocument = HydratedDocument<Snap>;

export enum Tags {
  PROOMOTION = 'PROMOTION',
  INTERESTING = 'INTERESTING',
  FINDINGS = 'FINDINGS',
  LOST = 'LOST',
  HIDDEN_GEM = 'HIDDEN_GEM',
  SOCIAL = 'SOCIAL',
}

export enum GeoPointType {
  Point = 'Point',
}

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
      enum: GeoPointType,
      default: GeoPointType.Point,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  })
  location: {
    type: GeoPointType.Point;
    coordinates: [number, number];
  };

  @Prop({ type: String, enum: Tags, default: Tags.SOCIAL })
  tag: Tags;
}

export const SnapSchema = SchemaFactory.createForClass(Snap);

SnapSchema.index({ location: '2dsphere' });
