import {
  IsEmail,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class CreateUserDTO {
  @IsStrongPassword({
    minLength: 6,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  password: string;

  @IsString()
  @IsOptional()
  bio: string;

  @IsEmail()
  email: string;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;
}
