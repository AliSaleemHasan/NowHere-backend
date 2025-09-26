import { Module } from '@nestjs/common';
import { AwsGrpcService } from './aws-grpc.service';
import { AwsGrpcController } from './aws-grpc.controller';
import { S3Module } from '../s3ObjectProvider/s3-object.module';
import { AwsStorageModule } from '../aws-storage/aws-storage.module';

@Module({
  imports: [S3Module, AwsStorageModule],
  providers: [AwsGrpcService],
  controllers: [AwsGrpcController],
})
export class AwsGrpcModule {}
