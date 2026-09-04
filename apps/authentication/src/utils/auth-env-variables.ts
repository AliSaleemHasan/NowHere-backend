import { IsEmail, IsOptional, IsString } from 'class-validator';
import { JwtRefreshMysqlNatsEnv } from 'nowhere-common';

export class AuthenticationEnvVariables extends JwtRefreshMysqlNatsEnv {
  @IsOptional()
  @IsEmail()
  ADMIN_EMAIL?: string;

  @IsOptional()
  @IsString()
  ADMIN_PASSWORD?: string;

  @IsOptional()
  @IsString()
  SMTP_HOST?: string;

  @IsOptional()
  @IsString()
  SMTP_PORT?: string;

  @IsOptional()
  @IsString()
  SMTP_FROM?: string;

  @IsOptional()
  @IsString()
  PASSWORD_RESET_BASE_URL?: string;
}
