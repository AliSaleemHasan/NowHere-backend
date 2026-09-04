import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { MAX_RESOLUTION_NOTE } from 'contracts';
import { GeoPointType, Tags } from 'nowhere-common';

export type SnapDocument = HydratedDocument<Snap>;

export enum SnapStatus {
  UPLOADING = 'UPLOADING',
  FAILED = 'FAILED',
  SUCCESS = 'SUCCESS',
  PROCESSING = 'PROCESSING',
}

export enum SnapResolution {
  OPEN = 'OPEN',
  FOUND = 'FOUND',
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Snap {
  @Prop({ required: true })
  description: string;

  @Prop({
    type: [String],
    required: true,
    validate: [(val: string[]) => val.length <= 4, 'Maximum 4 images allowed'],
  })
  snaps: string[];

  @Prop({ type: String, required: true })
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

  @Prop({ type: String, enum: SnapStatus, default: SnapStatus.PROCESSING })
  status: SnapStatus;

  @Prop({ type: Date })
  expiresAt: Date;

  @Prop({ type: String })
  idempotencyKey?: string;

  @Prop({ type: String, enum: SnapResolution, default: SnapResolution.OPEN })
  resolution: SnapResolution;

  @Prop({ type: String, maxlength: MAX_RESOLUTION_NOTE })
  resolutionNote?: string;

  @Prop({ type: String })
  resolvedBy?: string;

  @Prop({ type: Date })
  resolvedAt?: Date;
}

export const SnapSchema = SchemaFactory.createForClass(Snap);

SnapSchema.index({ location: '2dsphere' });
SnapSchema.index({ createdAt: -1, location: '2dsphere' });
SnapSchema.index({ expiresAt: 1 });
SnapSchema.index(
  { _userId: 1, idempotencyKey: 1 },
  { unique: true, sparse: true },
);
