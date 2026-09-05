import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SetUserPhotoDto {
  @ApiProperty({ example: 'profile/u1/1710000000-ab12cd.jpg' })
  @IsString()
  @IsNotEmpty()
  key: string;
}
