import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { GeoPointDto, MAX_UPLOAD_BATCH, Tags } from 'nowhere-common';

export class CreateSnapHttpDto {
  @ApiPropertyOptional({ example: 'Lost keys near the canal' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: { type: 'Point', coordinates: [13.405, 52.52] },
  })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as GeoPointDto;
      } catch {
        return value;
      }
    }
    return value;
  })
  @ValidateNested()
  @Type(() => GeoPointDto)
  location: GeoPointDto;

  @ApiProperty({
    type: [String],
    example: ['snaps/2026-09-04/user-id/photo.jpg'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_UPLOAD_BATCH)
  @IsString({ each: true })
  snaps: string[];

  @ApiPropertyOptional({ enum: Tags, example: Tags.SOCIAL })
  @IsOptional()
  @IsEnum(Tags)
  @Transform(({ value }: { value: unknown }) => value ?? Tags.SOCIAL)
  tag?: Tags;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  idempotencyKey?: string;
}
