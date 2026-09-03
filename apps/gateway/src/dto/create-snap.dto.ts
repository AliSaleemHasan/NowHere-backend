import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { GeoPointDto, MAX_UPLOAD_BATCH, Tags } from 'nowhere-common';

export class CreateSnapHttpDto {
  @IsString()
  @IsOptional()
  description?: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @ValidateNested()
  @Type(() => GeoPointDto)
  location: GeoPointDto;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_UPLOAD_BATCH)
  @IsString({ each: true })
  snaps: string[];

  @IsOptional()
  @IsEnum(Tags)
  @Transform(({ value }) => value ?? Tags.SOCIAL)
  tag?: Tags;
}