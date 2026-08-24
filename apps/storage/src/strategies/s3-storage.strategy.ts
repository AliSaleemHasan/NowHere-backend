import { Injectable, Logger } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import {
  PresignedUploadOptions,
  StorageStrategy,
} from './storage-strategy.interface';

@Injectable()
export class S3StorageStrategy implements StorageStrategy {
  private readonly logger = new Logger(S3StorageStrategy.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('AWS_BUCKET', 'mysnapsbucket');

    this.client = new S3Client({
      endpoint: this.config.get<string>(
        'AWS_ENDPOINT_URL',
        'http://minio-local:9000',
      ),
      region: this.config.get<string>('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
      forcePathStyle: true,
    });
  }

  async uploadFile(
    file: Buffer,
    key: string,
    contentType?: string,
  ): Promise<string> {
    this.logger.log(`[S3] Uploading direct file ${key}...`);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: contentType || 'image/jpeg',
      }),
    );
    return key;
  }

  async getDownloadSignedUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: 'inline',
    });
    return await getSignedUrl(this.client, command, { expiresIn });
  }

  async getUploadSignedUrl(options: PresignedUploadOptions): Promise<string> {
    const { key, contentType = 'image/jpeg', expiresIn = 3600 } = options;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return await getSignedUrl(this.client, command, { expiresIn });
  }

  async listFiles(prefix = ''): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    });
    const response = await this.client.send(command);
    return (response.Contents || []).map((obj) => obj.Key || '').filter(Boolean);
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
