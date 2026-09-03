import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class StroageEnvVariables {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(65535)
  NEST_PORT?: number;

  @IsOptional()
  @IsString()
  STORAGE_PROVIDER?: string;

  @ValidateIf(
    (env: StroageEnvVariables) =>
      (env.STORAGE_PROVIDER || 'aws').toLowerCase() !== 'gcp' &&
      (env.STORAGE_PROVIDER || 'aws').toLowerCase() !== 'gcs' &&
      (env.STORAGE_PROVIDER || 'aws').toLowerCase() !== 'google',
  )
  @IsString({ message: 'BUCKET name used in AWS S3 / MinIO' })
  AWS_BUCKET?: string;

  @ValidateIf(
    (env: StroageEnvVariables) =>
      (env.STORAGE_PROVIDER || 'aws').toLowerCase() !== 'gcp' &&
      (env.STORAGE_PROVIDER || 'aws').toLowerCase() !== 'gcs' &&
      (env.STORAGE_PROVIDER || 'aws').toLowerCase() !== 'google',
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

  @ValidateIf((env: StroageEnvVariables) => {
    const provider = (env.STORAGE_PROVIDER || 'aws').toLowerCase();
    return provider === 'gcp' || provider === 'gcs' || provider === 'google';
  })
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

  @IsOptional()
  @IsString()
  NATS_URL?: string;
}
