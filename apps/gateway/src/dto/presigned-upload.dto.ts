import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { MAX_UPLOAD_BATCH } from 'nowhere-common';

export class PresignFileDto {
  @ApiPropertyOptional({ example: 'photo.jpg' })
  @IsOptional()
  @IsString()
  filename?: string;

  @ApiPropertyOptional({ example: 'image/jpeg' })
  @IsOptional()
  @IsString()
  contentType?: string;
}

export class PresignedUploadDto {
  @ApiPropertyOptional({ type: [PresignFileDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_UPLOAD_BATCH)
  @ValidateNested({ each: true })
  @Type(() => PresignFileDto)
  files?: PresignFileDto[];

  @ApiPropertyOptional({ example: 'photo.jpg' })
  @IsOptional()
  @IsString()
  filename?: string;

  @ApiPropertyOptional({ example: 'image/jpeg' })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({ example: 'snaps', enum: ['snaps', 'profile'] })
  @IsOptional()
  @IsString()
  prefix?: string;
}
