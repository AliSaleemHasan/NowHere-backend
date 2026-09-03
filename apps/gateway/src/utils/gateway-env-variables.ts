import { IsOptional, IsString } from 'class-validator';

export class GatewayEnvVariables {
  @IsOptional()
  @IsString()
  PORT?: string;

  @IsOptional()
  @IsString()
  NEST_PORT?: string;

  @IsString()
  ACCESS_SECRET!: string;

  @IsString()
  NATS_URL!: string;

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;

  @IsOptional()
  @IsString()
  NODE_ENV?: string;
}
