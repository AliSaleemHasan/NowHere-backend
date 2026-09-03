import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class SnapsEnvVariables {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(65535)
  NEST_PORT?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(65535)
  MONGO_PORT?: number;

  @IsString({ message: 'Name of used snaps Mongodb database' })
  MONGO_DATABASE!: string;

  @IsOptional()
  @IsString()
  MONGO_ROOT_USER?: string;

  @IsOptional()
  @IsString()
  MONGO_ROOT_PASS?: string;

  @IsString()
  MONGO_HOST!: string;

  @IsOptional()
  @IsString()
  MONGO_URI?: string;

  @IsOptional()
  @IsNumber()
  MAX_DISTANCE_NEAR?: number;

  @IsOptional()
  @IsNumber()
  MIN_DISTANCE_SAME_USER?: number;

  @IsOptional()
  @IsNumber()
  SNAP_DISAPPEAR_TIME?: number;

  @IsString({ message: 'Access secret used for JWT authentication' })
  ACCESS_SECRET!: string;

  @IsOptional()
  @IsString()
  GATEWAY_URL?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;

  @IsOptional()
  @IsString()
  NATS_URL?: string;

  @IsOptional()
  @IsString()
  ENABLE_SEED?: string;

  @IsOptional()
  @IsString()
  NODE_ENV?: string;
}
