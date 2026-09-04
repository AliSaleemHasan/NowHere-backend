import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';
import { PASSWORD_POLICY_MESSAGE } from 'contracts';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1,
    },
    { message: PASSWORD_POLICY_MESSAGE },
  )
  @IsNotEmpty()
  newPassword: string;
}
