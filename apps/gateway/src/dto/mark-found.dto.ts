import { IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_RESOLUTION_NOTE } from 'contracts';

export class MarkFoundHttpDto {
  @IsOptional()
  @IsString()
  @MaxLength(MAX_RESOLUTION_NOTE)
  note?: string;
}
