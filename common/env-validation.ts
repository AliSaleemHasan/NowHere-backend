import { plainToInstance } from 'class-transformer';
import { IsNumber, IsString, Max, Min, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsNumber()
  @Min(0)
  @Max(65535)
  NEST_PORT: number;

  @IsNumber()
  @Min(0)
  @Max(65535)
  MONGO_PORT: number;

  @IsNumber()
  @Min(0)
  @Max(65535)
  MONGO_EXPRESS_PORT: number;

  @IsString()
  MONGO_DATABASE: string;

  @IsString()
  MONGO_ROOT_USER: string;

  @IsString()
  MONGO_ROOT_PASS: string;

  @IsString()
  MONGO_HOST: string;

  @IsNumber()
  @Min(0)
  @Max(65535)
  MYSQL_PORT: number;
  @IsString()
  MYSQL_DATABASE: string;
  @IsString()
  MYSQL_ROOT_PASS: string;
  @IsString()
  MYSQL_USER: string;
  @IsString()
  MYSQL_PASS: string;
  @IsString()
  MYSQL_HOST: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
