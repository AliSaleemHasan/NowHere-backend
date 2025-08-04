import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class SigninDTO {
  @IsString()
  @IsEmail()
  email: string;

  @IsStrongPassword({
    minLength: 6,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  password: string;
}
