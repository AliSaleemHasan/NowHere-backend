import { Roles } from 'apps/authentication/src/entities/user-credentials-entity';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class CreateCredentialDTO {
  @IsStrongPassword({
    minLength: 6,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  password: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(Roles)
  role?: Roles.ADMIN | Roles.USER;
}
