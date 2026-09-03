import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { OptionalNatsEnv } from 'nowhere-common';
import { isGcpStorageProvider } from './storage-provider';

export class StorageEnvVariables extends OptionalNatsEnv {
  @IsOptional()
  @IsString()
  STORAGE_PROVIDER?: string;

  @ValidateIf(
    (env: StorageEnvVariables) => !isGcpStorageProvider(env.STORAGE_PROVIDER),
  )
  @IsString({ message: 'BUCKET name used in AWS S3 / MinIO' })
  AWS_BUCKET?: string;

  @ValidateIf(
    (env: StorageEnvVariables) => !isGcpStorageProvider(env.STORAGE_PROVIDER),
  )
  @IsString({ message: 'Region of AWS Bucket used' })
  AWS_REGION?: string;

  @IsOptional()
  @IsString()
  AWS_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  AWS_SECRET_ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  AWS_ENDPOINT_URL?: string;

  @ValidateIf((env: StorageEnvVariables) =>
    isGcpStorageProvider(env.STORAGE_PROVIDER),
  )
  @IsOptional()
  @IsString()
  GCP_BUCKET?: string;

  @IsOptional()
  @IsString()
  GCP_PROJECT_ID?: string;

  @IsString()
  REDIS_URL!: string;

  @IsOptional()
  @IsNumber()
  CACHE_TTL?: number;
}
