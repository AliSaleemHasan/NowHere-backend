import { S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { S3Provider } from '../s3ObjectProvider/s3-object.provider';
import { AwsStorageService } from '../aws-storage/aws-storage.service';

@Injectable()
export class AwsGrpcService {
  private readonly logger: Logger = new Logger(AwsGrpcService.name);
  private client: S3Client;
  private bucket: string;

  // here no async functions are required...
  constructor(
    private readonly S3: S3Provider,
    private storageService: AwsStorageService,
  ) {
    this.client = this.S3.getClient();
    this.bucket = this.S3.getBucket();
  }
  // save profile photos

  async uploadPhoto(image: Buffer, userId: string) {
    let key = `profile/${userId}`;
    return await this.storageService.uploadFile(image, key);
  }

  // get one photo
  async getSignedUrl(key: string) {
    try {
      return await this.storageService.getSignedUrlForFile(key);
    } catch (e) {
      this.logger.error(e.message);
    }
  }
  // get multiple photos

  async getSignedUrLs(keys: string[]) {
    let outputs: string[] = [];
    for (const key of keys) {
      outputs.push((await this.getSignedUrl(key)) as string);
    }

    return outputs;
  }
}
