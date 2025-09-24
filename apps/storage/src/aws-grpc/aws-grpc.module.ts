import { Module } from '@nestjs/common';
import { AwsGrpcService } from './aws-grpc.service';
import { AwsGrpcController } from './aws-grpc.controller';
import { ClientsModule } from '@nestjs/microservices';
import { storageProtoOptions } from 'proto';
import { ClientOptions } from '@grpc/grpc-js';
import { S3Module } from '../s3ObjectProvider/s3-object.module';
import { AwsStorageModule } from '../aws-storage/aws-storage.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'STORAGE',
        ...(storageProtoOptions as ClientOptions),
      },
    ]),
    S3Module,
    AwsStorageModule,
  ],
  providers: [AwsGrpcService],
  controllers: [AwsGrpcController],
})
export class AwsGrpcModule {}
