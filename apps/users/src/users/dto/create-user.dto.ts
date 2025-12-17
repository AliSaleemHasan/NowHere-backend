import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { Roles } from '../entities/user.entity';

export class CreateUserDTO {

  @IsOptional()
  Id?: string;



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
