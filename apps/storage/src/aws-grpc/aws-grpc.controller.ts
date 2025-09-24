import { Controller } from '@nestjs/common';
import {
  AWS_STORAGE_SERVICE_NAME,
  AwsStorageController,
  Key,
  Keys,
  SignedURL,
  SignedURLs,
  UploadImageDto,
} from 'proto';
import { GrpcMethod } from '@nestjs/microservices';
import { AwsGrpcService } from './aws-grpc.service';

@Controller()
export class AwsGrpcController implements AwsStorageController {
  constructor(private awsGrpcService: AwsGrpcService) {}
  @GrpcMethod(AWS_STORAGE_SERVICE_NAME, 'uploadPhoto')
  async uploadPhoto(request: UploadImageDto): Promise<Key> {
    return {
      key: await this.awsGrpcService.uploadPhoto(
        request.image as Buffer,
        request.userId,
      ),
    };
  }

  @GrpcMethod(AWS_STORAGE_SERVICE_NAME, 'getSignedUrl')
  async getSignedUrl(request: Key): Promise<SignedURL> {
    return {
      signed: (await this.awsGrpcService.getSignedURL(request.key)) as string,
    };
  }
  async getSignedUrLs(request: Keys): Promise<SignedURLs> {
    return {
      urls: await this.awsGrpcService.getSignedURLS(request.keys),
    };
  }
}
