import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SigninDTO {
  @ApiProperty({ example: 'ada@localhost' })
  @IsEmail({}, { message: 'Invalid email address format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
