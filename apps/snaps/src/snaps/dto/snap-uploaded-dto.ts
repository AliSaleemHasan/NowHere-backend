import { IsArray, IsOptional, IsString } from 'class-validator';

export class SnapUploadedDto {
  @IsString()
  snapId: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keys: string[];

  @IsArray()
  @IsString({ each: true })
  filesNames: string[];
  @IsString()
  @IsOptional()
  error: string;
}
