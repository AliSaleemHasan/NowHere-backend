import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_RESOLUTION_NOTE } from 'contracts';

export class MarkFoundHttpDto {
  @ApiPropertyOptional({ maxLength: MAX_RESOLUTION_NOTE })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_RESOLUTION_NOTE)
  note?: string;
}
