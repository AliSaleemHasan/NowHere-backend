import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SnapDocument = HydratedDocument<SnapSettings>;
@Schema()
export class SnapSettings {
  // for settings we need a list of tags for each user  ( so heare we need userID)

  @Prop({ type: String, required: true, unique: true })
  _userId: string;

  // now for the distination to show the snaps in meters
  @Prop({ type: Number, default: 100 })
  max_distance: number;

  // the minimum distance for sharing more than one post
  @Prop({ type: Number, default: 1000 })
  new_snap_distance: number;

  @Prop({ type: Number, default: 1 })
  snapDissapperanceTime: number;
}

export const SnapSettingsSchema = SchemaFactory.createForClass(SnapSettings);
