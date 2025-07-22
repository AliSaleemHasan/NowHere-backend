import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SanpDocument = HydratedDocument<Snap>;
@Schema()
export class Snap {
  @Prop()
  description: string;
}

export const SnapSchema = SchemaFactory.createForClass(Snap);
