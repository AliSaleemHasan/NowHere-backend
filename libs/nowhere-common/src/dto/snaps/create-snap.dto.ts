import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { GeoPointType, Tags } from 'nowhere-common/types/common-types';

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
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((item) => Number(item)) : value,
  )
  @IsNumber({}, { each: true, message: 'coordinates must be numbers' })
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

  @IsArray()
  @ArrayMinSize(1, { message: 'Provide at least 1 uploaded image key' })
  @ArrayMaxSize(4, { message: 'Maximum 4 images allowed' })
  @IsString({ each: true })
  snaps: string[];

  @IsEnum(Tags, { each: true })
  @Transform(({ value }) => value ?? Tags.SOCIAL)
  tag?: Tags;
}
