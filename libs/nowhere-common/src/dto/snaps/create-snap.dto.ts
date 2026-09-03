import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { GeoPointType } from '../../types/common-types';

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
