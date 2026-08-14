import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsNumberString,
  IsOptional,
} from 'class-validator';
import { Tags } from '../schemas/snap.schema';
import { ApiPropertyOptional } from '@nestjs/swagger';

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
  @IsNumber()
  id: string;

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
