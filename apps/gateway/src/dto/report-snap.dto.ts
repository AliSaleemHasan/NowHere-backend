import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_REPORT_DETAILS, REPORT_REASONS, ReportReason } from 'contracts';

export class ReportSnapHttpDto {
  @ApiProperty({ enum: REPORT_REASONS })
  @IsIn([...REPORT_REASONS])
  reason: ReportReason;

  @ApiPropertyOptional({ maxLength: MAX_REPORT_DETAILS })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_REPORT_DETAILS)
  details?: string;
}
