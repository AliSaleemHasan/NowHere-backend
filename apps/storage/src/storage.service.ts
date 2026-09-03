import {
  Injectable,
  Logger,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import {
  STORAGE_STRATEGY,
  StorageStrategy,
} from './strategies/storage-strategy.interface';
import { tryCatch } from 'nowhere-common';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    @Inject(STORAGE_STRATEGY) private readonly strategy: StorageStrategy,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  async getPresignedUploadUrl(
    key: string,
    contentType: string = 'image/jpeg',
    expiresIn: number = 3600,
  ): Promise<{ uploadUrl: string; key: string }> {
    this.logger.log(`Generating presigned upload URL for key: ${key}`);
    const { data: uploadUrl, error } = await tryCatch(
      this.strategy.getUploadSignedUrl({ key, contentType, expiresIn }),
    );

    if (error || !uploadUrl) {
      this.logger.error(`Failed to generate upload URL: ${error?.message}`);
      throw new InternalServerErrorException(
        'Failed to generate presigned upload URL',
      );
    }

    return { uploadUrl, key };
  }

  /**
   * Generates a signed download URL (cached in Redis)
   */
  async getSignedUrlForFile(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const cachedUrl = await this.cacheManager.get<string>(key);
    if (cachedUrl) return cachedUrl;

    const { data: signedURL, error } = await tryCatch(
      this.strategy.getDownloadSignedUrl(key, expiresIn),
    );

    if (error || !signedURL) {
      this.logger.error(
        `Failed to generate signed download URL: ${error?.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to generate signed download URL',
      );
    }

    await this.cacheManager.set(
      key,
      signedURL,
      Number(this.configService.get('CACHE_TTL')) || 86340,
    );

    return signedURL;
  }

  /**
   * Direct server-side buffer upload
   */
  async uploadFile(
    file: Buffer,
    key: string,
    contentType?: string,
  ): Promise<string> {
    this.logger.log(`Uploading direct file buffer for ${key}...`);
    const { data, error } = await tryCatch(
      this.strategy.uploadFile(file, key, contentType),
    );

    if (error || !data) {
      this.logger.error(`Direct file upload failed: ${error?.message}`);
      throw new InternalServerErrorException('File upload failed');
    }

    return data;
  }

  async listFiles(prefix = ''): Promise<string[]> {
    const { data, error } = await tryCatch(this.strategy.listFiles(prefix));
    if (error) {
      this.logger.error(`List files failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to list files');
    }
    return data || [];
  }

  async deleteFile(key: string): Promise<void> {
    const { error } = await tryCatch(this.strategy.deleteFile(key));
    if (error) {
      this.logger.error(`Delete file failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  async uploadPhoto(image: Buffer, userId: string): Promise<string> {
    const key = `profile/${userId}`;
    return await this.uploadFile(image, key);
  }

  async getSignedUrls(keys: string[]): Promise<string[]> {
    const outputs: string[] = [];
    for (const key of keys) {
      outputs.push(await this.getSignedUrlForFile(key));
    }
    return outputs;
  }

}
