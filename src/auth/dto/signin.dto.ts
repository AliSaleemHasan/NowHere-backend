import { IsString, IsStrongPassword, MinLength } from 'class-validator';

export class SigninDTO {
  @IsString()
  username: string;

  @IsStrongPassword({
    minLength: 6,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  password: string;
}
