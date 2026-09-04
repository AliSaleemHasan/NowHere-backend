import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteAccountDto {
  @ApiProperty({ description: 'Current password (re-auth)' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
