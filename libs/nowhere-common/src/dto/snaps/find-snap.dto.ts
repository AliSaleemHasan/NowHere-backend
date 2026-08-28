import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Tags } from 'nowhere-common/types/common-types';

export class FindSnapDTO {
  @ApiPropertyOptional({
    enum: Tags,
    isArray: true,
    description: 'Filter snaps by tags',
    example: [Tags.PROOMOTION, Tags.LOST],
  })
  @IsOptional()
  @IsEnum(Tags, { each: true, message: 'Each tag must be a valid Tags value' })
  tags: Tags[];

  @IsOptional()
  @IsString()
  id?: string;

  @IsArray()
  @ArrayMinSize(2, {
    message: 'coordinates must have exactly 2 values [lng, lat]',
  })
  @ArrayMaxSize(2, {
    message: 'coordinates must have exactly 2 values [lng, lat]',
  })
  @IsOptional()
  @IsNumberString({}, { each: true, message: 'coordinates must be numbers' })
  location: [number, number];
}
