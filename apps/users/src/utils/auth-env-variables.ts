import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UsersEnvVariables {
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

  @IsString({ message: 'Name of used MYSQL users database' })
  MYSQL_DATABASE!: string;

  @IsOptional()
  @IsString()
  MYSQL_ROOT_PASS?: string;

  @IsString({ message: 'Username of used Users Database' })
  MYSQL_USER!: string;

  @IsString({ message: 'Password of used Users database' })
  MYSQL_PASS!: string;

  @IsString()
  MYSQL_HOST!: string;

  @IsString()
  NATS_URL!: string;

  @IsOptional()
  @IsString()
  TYPEORM_SYNC?: string;

  @IsOptional()
  @IsString()
  NODE_ENV?: string;
}
