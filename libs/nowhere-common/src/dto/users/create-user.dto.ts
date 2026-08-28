import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { ROLES } from 'contracts';

export class CreateUserDTO {
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  bio: string;

  @IsEmail()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}
