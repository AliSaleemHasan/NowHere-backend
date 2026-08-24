import { Injectable, Logger } from '@nestjs/common';
import { Storage, Bucket } from '@google-cloud/storage';
import { ConfigService } from '@nestjs/config';
import {
  PresignedUploadOptions,
  StorageStrategy,
} from './storage-strategy.interface';

@Injectable()
export class GCSStorageStrategy implements StorageStrategy {
  private readonly logger = new Logger(GCSStorageStrategy.name);
  private readonly storage: Storage;
  private readonly bucket: Bucket;
  private readonly bucketName: string;

  constructor(private readonly config: ConfigService) {
    this.bucketName = this.config.get<string>(
      'GCS_BUCKET',
      this.config.get<string>('AWS_BUCKET', 'mysnapsbucket'),
    );

    const projectId =
      this.config.get<string>('GCP_PROJECT_ID') ||
      this.config.get<string>('GOOGLE_CLOUD_PROJECT');
    const keyFilename = this.config.get<string>('GCP_KEY_FILE');

    this.storage = new Storage({
      projectId,
      keyFilename,
    });

    this.bucket = this.storage.bucket(this.bucketName);
  }

  async uploadFile(
    file: Buffer,
    key: string,
    contentType?: string,
  ): Promise<string> {
    this.logger.log(`[GCS] Uploading direct file ${key}...`);
    const blob = this.bucket.file(key);
    await blob.save(file, {
      contentType: contentType || 'image/jpeg',
      resumable: false,
    });
    return key;
  }

  async getDownloadSignedUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const file = this.bucket.file(key);
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresIn * 1000,
    });
    return url;
  }

  async getUploadSignedUrl(options: PresignedUploadOptions): Promise<string> {
    const { key, contentType = 'image/jpeg', expiresIn = 3600 } = options;
    const file = this.bucket.file(key);
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + expiresIn * 1000,
      contentType,
    });
    return url;
  }

  async listFiles(prefix = ''): Promise<string[]> {
    const [files] = await this.bucket.getFiles({ prefix });
    return files.map((file) => file.name);
  }

  async deleteFile(key: string): Promise<void> {
    await this.bucket.file(key).delete();
  }
}
