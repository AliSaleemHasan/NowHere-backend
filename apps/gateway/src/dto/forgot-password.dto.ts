import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'ada@localhost' })
  @IsEmail({}, { message: 'Invalid email address format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}
