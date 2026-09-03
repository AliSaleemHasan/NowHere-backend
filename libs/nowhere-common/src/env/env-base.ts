import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class NestRuntimeEnv {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(65535)
  NEST_PORT?: number;

  @IsOptional()
  @IsString()
  NODE_ENV?: string;
}

export class RequiredNatsEnv extends NestRuntimeEnv {
  @IsString()
  NATS_URL!: string;
}

export class OptionalNatsEnv extends NestRuntimeEnv {
  @IsOptional()
  @IsString()
  NATS_URL?: string;
}

export class MysqlRequiredNatsEnv extends RequiredNatsEnv {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(65535)
  MYSQL_PORT?: number;

  @IsString({ message: 'Name of used MYSQL database' })
  MYSQL_DATABASE!: string;

  @IsOptional()
  @IsString()
  MYSQL_ROOT_PASS?: string;

  @IsString({ message: 'Username of used MYSQL database' })
  MYSQL_USER!: string;

  @IsString({ message: 'Password of used MYSQL database' })
  MYSQL_PASS!: string;

  @IsString()
  MYSQL_HOST!: string;

  @IsOptional()
  @IsString()
  TYPEORM_SYNC?: string;
}

export class JwtAccessRequiredNatsEnv extends RequiredNatsEnv {
  @IsString({ message: 'Secret used for JWT authentication' })
  ACCESS_SECRET!: string;

  @IsOptional()
  @IsString()
  ACCESS_EXP?: string;
}

export class JwtAccessOptionalNatsEnv extends OptionalNatsEnv {
  @IsString({ message: 'Secret used for JWT authentication' })
  ACCESS_SECRET!: string;

  @IsOptional()
  @IsString()
  ACCESS_EXP?: string;
}

export class JwtRefreshMysqlNatsEnv extends MysqlRequiredNatsEnv {
  @IsString({ message: 'Secret used for JWT authentication' })
  ACCESS_SECRET!: string;

  @IsOptional()
  @IsString()
  ACCESS_EXP?: string;

  @IsString({ message: 'Refresh secret used for refreshing JWT access token' })
  REFRESH_SECRET!: string;

  @IsOptional()
  @IsString()
  REFRESH_EXP?: string;
}
