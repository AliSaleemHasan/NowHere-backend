import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private logger = new Logger(StorageService.name);
  private client: S3Client;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.bucket = this.config.getOrThrow('AWS_BUCKET');

    const creds: any = {
      accessKeyId: this.config.getOrThrow('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.config.getOrThrow('AWS_SECRET_ACCESS_KEY'),
    };
    // const sessionToken = this.config.get('AWS_SESSION_TOKEN');
    // if (sessionToken) creds.sessionToken = sessionToken;

    this.client = new S3Client({
      region: this.config.getOrThrow('AWS_REGION'),
      credentials: creds,
    });
  }

  async uploadFile(file: Buffer, fileName: string, userID: string) {
    const today = new Date().toISOString().split('T')[0]; // safer format
    const key = `${today}/${userID}/${fileName}`;
    this.logger.log(`Uploading ${key} to S3...`);

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file,
        }),
      );
      return key;
    } catch (e) {
      this.logger.error(`Upload failed: ${e.message}`);
      throw new InternalServerErrorException('File upload failed');
    }
  }

  async listFiles(prefix = '') {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    });
    const response = await this.client.send(command);
    return (response.Contents || []).map((obj) => obj.Key);
  }

  async getSignedUrlForFile(key: string, expiresIn = 3600) {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return await getSignedUrl(this.client, command, { expiresIn });
  }
}
