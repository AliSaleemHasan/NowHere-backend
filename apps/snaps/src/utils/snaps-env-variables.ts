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
  @IsString({ message: 'Name of used MYSQL users database' })
  MONGO_DATABASE!: string;
  @IsString({ message: "Password for Users Database' root user" })
  MONGO_ROOT_USER!: string;

  @IsString({ message: 'Password of used Users database' })
  MONGO_HOST!: string;

  @IsNumber()
  MAX_DISTANCE_NEAR!: number;
  @IsNumber()
  MIN_DISTANCE_SAME_USER!: number;

  @IsString({ message: 'Refrech secret usef for refreshing JWT access token' })
  ACCESS_SECRET!: string;

  @IsString()
  STATIC_TMP_FILES!: string;

  @IsString()
  GATEWAY_URL!: string;
}
