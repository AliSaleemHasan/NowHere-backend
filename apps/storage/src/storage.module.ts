import { Module } from '@nestjs/common';
import { AwsStorageModule } from './aws-storage/aws-storage.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import * as path from 'path';
import { AwsGrpcModule } from './aws-grpc/aws-grpc.module';
import { getValidateFn } from 'nowhere-common';
import { StroageEnvVariables } from './utils/storage-env-variables';

@Module({
  imports: [
    AwsStorageModule,
    AwsGrpcModule,

    ConfigModule.forRoot({
      validate: getValidateFn(StroageEnvVariables),
      isGlobal: true,
      envFilePath: [path.resolve(process.cwd(), '.env')],
    }),
    JwtModule.register({
      global: true,
    }),
  ],
})
export class StorageModule {}
