import { IsOptional, IsString } from 'class-validator';
import { JwtAccessRequiredNatsEnv } from 'nowhere-common';

export class GatewayEnvVariables extends JwtAccessRequiredNatsEnv {
  @IsOptional()
  @IsString()
  PORT?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;
}
