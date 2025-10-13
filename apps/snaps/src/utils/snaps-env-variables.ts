import { IsNumber, IsString, Max, Min } from 'class-validator';

export class SnapsEnvVariables {
  @IsNumber()
  @Min(0)
  @Max(65535)
  NEST_PORT!: number;

  @IsNumber()
  @Min(0)
  @Max(65535)
  MONGO_PORT!: number;
  @IsString({ message: 'Name of used snaps Mongodb database' })
  MONGO_DATABASE!: string;
  @IsString({ message: "Password for snaps Database' root user" })
  MONGO_ROOT_USER!: string;

  @IsString({ message: 'Password of used snaps database' })
  MONGO_HOST!: string;

  @IsNumber()
  MAX_DISTANCE_NEAR!: number;
  @IsNumber()
  MIN_DISTANCE_SAME_USER!: number;

  @IsString({ message: 'Access secret used for JWT authentication' })
  ACCESS_SECRET!: string;

  @IsString({
    message:
      'Folder PATH to get uploded temporary file from (USED in STROAGE too)',
  })
  STATIC_TMP_FILES!: string;

  @IsString()
  GATEWAY_URL!: string;
}
