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
  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @IsString()
  contentType?: string;
}

export class PresignedUploadDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_UPLOAD_BATCH)
  @ValidateNested({ each: true })
  @Type(() => PresignFileDto)
  files?: PresignFileDto[];

  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @IsString()
  contentType?: string;

  @IsOptional()
  @IsString()
  prefix?: string;
}
