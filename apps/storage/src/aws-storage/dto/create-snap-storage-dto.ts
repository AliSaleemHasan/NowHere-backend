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

export class GeoPointDto {
  @IsOptional()
  type: string;

  @IsArray()
  @ArrayMinSize(2, {
    message: 'coordinates must have exactly 2 values [lng, lat]',
  })
  @ArrayMaxSize(2, {
    message: 'coordinates must have exactly 2 values [lng, lat]',
  })
  @IsNumber({}, { each: true, message: 'coordinates must be numbers' })
  coordinates: [number, number];
}
export class CreateSnapStorageDTO {
  @IsString()
  @IsOptional()
  description: string;

  @IsOptional()
  @IsUUID()
  _userId?: string;

  @Type(() => GeoPointDto)
  location: GeoPointDto;

  snaps: string[];

  @IsString()
  tag?: string;
}
