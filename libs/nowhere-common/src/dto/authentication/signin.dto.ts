import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class SigninDTO {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
