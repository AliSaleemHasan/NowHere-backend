import { IsEmail, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class AuthenticationEnvVariables {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(65535)
  NEST_PORT?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(65535)
  MYSQL_PORT?: number;

  @IsString({ message: 'Name of used MYSQL credentials database' })
  MYSQL_DATABASE!: string;

  @IsOptional()
  @IsString()
  MYSQL_ROOT_PASS?: string;

  @IsString({ message: 'Username of used credentials database' })
  MYSQL_USER!: string;

  @IsString({ message: 'Password of used credentials database' })
  MYSQL_PASS!: string;

  @IsString()
  MYSQL_HOST!: string;

  @IsString({ message: 'Secret used for JWT authentication' })
  ACCESS_SECRET!: string;

  @IsString({ message: 'Refresh secret used for refreshing JWT access token' })
  REFRESH_SECRET!: string;

  @IsOptional()
  @IsString()
  ACCESS_EXP?: string;

  @IsOptional()
  @IsString()
  REFRESH_EXP?: string;

  @IsOptional()
  @IsEmail()
  ADMIN_EMAIL?: string;

  @IsOptional()
  @IsString()
  ADMIN_PASSWORD?: string;

  @IsString()
  NATS_URL!: string;

  @IsOptional()
  @IsString()
  TYPEORM_SYNC?: string;

  @IsOptional()
  @IsString()
  NODE_ENV?: string;
}
