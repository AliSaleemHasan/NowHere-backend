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
import { GeoPointType, Tags } from 'nowhere-common/types/common-types';
import { GeoPointDto } from 'nowhere-common/dto/snaps/create-snap.dto';

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
  @ArrayMaxSize(4)
  @IsString({ each: true })
  snaps: string[];

  @IsOptional()
  @IsEnum(Tags)
  @Transform(({ value }) => value ?? Tags.SOCIAL)
  tag?: Tags;
}

export { GeoPointDto, GeoPointType };
