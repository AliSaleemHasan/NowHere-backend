import { IsEmail, IsOptional, IsString } from 'class-validator';
import { JwtRefreshMysqlNatsEnv } from 'nowhere-common';

export class AuthenticationEnvVariables extends JwtRefreshMysqlNatsEnv {
  @IsOptional()
  @IsEmail()
  ADMIN_EMAIL?: string;

  @IsOptional()
  @IsString()
  ADMIN_PASSWORD?: string;
}
