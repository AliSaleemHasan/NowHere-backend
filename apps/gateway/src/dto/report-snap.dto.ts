import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_REPORT_DETAILS, REPORT_REASONS, ReportReason } from 'contracts';

export class ReportSnapHttpDto {
  @IsIn([...REPORT_REASONS])
  reason: ReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_REPORT_DETAILS)
  details?: string;
}
