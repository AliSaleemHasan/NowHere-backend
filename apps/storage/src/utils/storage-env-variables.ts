import { IsNumber, IsString, Max, Min } from 'class-validator';

export class StroageEnvVariables {
  @IsNumber()
  @Min(0)
  @Max(65535)
  NEST_PORT!: number;

  @IsString({ message: 'BUCKET name used in AWS S3' })
  AWS_BUCKET!: string;
  @IsString({ message: 'Region of AWS Bucket used' })
  AWS_REGION!: string;

  @IsString()
  AWS_ACCESS_KEY_ID!: string;

  @IsString()
  AWS_SECRET_ACCESS_KEY!: string;

  @IsString({ message: 'Access secret used for JWT authentication' })
  ACCESS_SECRET!: string;

  @IsString({
    message:
      'Folder PATH to get uploded temporary file from (USED in STROAGE too)',
  })
  STATIC_TMP_FILES!: string;

  @IsString()
  SNAPS_URL!: string;

  @IsString()
  REDIS_URL!: string;

  @IsNumber()
  CACHE_TTL!: number;
}
