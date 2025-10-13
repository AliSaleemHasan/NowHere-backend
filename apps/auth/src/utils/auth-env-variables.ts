import { IsEmail, IsNumber, IsString, Max, Min } from 'class-validator';

export class AuthEnvVariables {
  @IsNumber()
  @Min(0)
  @Max(65535)
  NEST_PORT!: number;

  @IsNumber()
  @Min(0)
  @Max(65535)
  MYSQL_PORT!: number;
  @IsString({ message: 'Name of used MYSQL users database' })
  MYSQL_DATABASE!: string;
  @IsString({ message: "Password for Users Database' root user" })
  MYSQL_ROOT_PASS!: string;
  @IsString({ message: 'Username of used Users Database' })
  MYSQL_USER!: string;
  @IsString({ message: 'Password of used Users database' })
  MYSQL_PASS!: string;
  @IsString({
    message:
      'Host of users databse, please put your host here (aws,gcp ..etc.)',
  })
  MYSQL_HOST!: string;

  @IsString({ message: 'Secret used for JWT authentication' })
  ACCESS_SECRET!: string;

  @IsString({ message: 'Refrech secret usef for refreshing JWT access token' })
  REFRESH_SECRET!: string;

  @IsString()
  ACCESS_EXP!: string;

  @IsString()
  REFRESH_EXP!: string;

  @IsEmail()
  ADMIN_EMAIL!: string;

  @IsString()
  ADMIN_PASSWORD!: string;
}
