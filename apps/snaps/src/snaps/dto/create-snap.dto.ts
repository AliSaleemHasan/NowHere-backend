import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { GeoPointType, Tags } from '../schemas/snap.schema';
import { Transform, Type } from 'class-transformer';

export class GeoPointDto {
  @IsEnum(GeoPointType, { message: "type must be 'Point'" })
  type: GeoPointType;

  @IsArray()
  @ArrayMinSize(2, {
    message: 'coordinates must have exactly 2 values [lng, lat]',
  })
  @ArrayMaxSize(2, {
    message: 'coordinates must have exactly 2 values [lng, lat]',
  })
  @IsNumberString({}, { each: true, message: 'coordinates must be numbers' })
  coordinates: [number, number];
}
export class CreateSnapDto {
  @IsString()
  @IsOptional()
  description: string;

  @IsOptional()
  @IsUUID()
  _userId?: string;

  @Type(() => GeoPointDto)
  location: GeoPointDto;

  snaps: string[];

  @IsEnum(Tags, { each: true })
  @Transform(({ value }) => value ?? Tags.SOCIAL)
  tag?: Tags;
}
