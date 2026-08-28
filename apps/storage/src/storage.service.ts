import {
  Injectable,
  Logger,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
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
  ) {}

  /**
   * Generates a unique key for presigned uploads
   */
  generatePresignedUploadKey(
    userId: string,
    options?: { filename?: string; prefix?: string },
  ): string {
    const today = new Date().toISOString().split('T')[0];
    const uniqueSuffix =
      Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    const ext = options?.filename ? options.filename.split('.').pop() : 'jpg';
    const folder = options?.prefix || 'snaps';
    return `${folder}/${today}/${userId || 'user'}/${uniqueSuffix}.${ext}`;
  }

  /**
   * Generates a presigned upload URL for direct client upload
   */
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
      Number(process.env.CACHE_TTL) || 86340,
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

  /**
   * Helper for profile photo uploads (used by gRPC)
   */
  async uploadPhoto(image: Buffer, userId: string): Promise<string> {
    const key = `profile/${userId}`;
    return await this.uploadFile(image, key);
  }

  /**
   * Helper for multiple signed URLs (used by gRPC)
   */
  async getSignedUrls(keys: string[]): Promise<string[]> {
    const outputs: string[] = [];
    for (const key of keys) {
      outputs.push(await this.getSignedUrlForFile(key));
    }
    return outputs;
  }

  /**
   * Backward-compatible helper for tmp file saving
   */
  async saveLocalFiles(files: Array<Express.Multer.File>, userId: string) {
    const notSaved: Array<Express.Multer.File> = [];
    const keys: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const fileName = files[i].filename;

      const { data: file, error: fetchError } = await tryCatch(
        fetch(
          `${process.env.SNAPS_URL}/${process.env.STATIC_TMP_FILES}/${fileName}`,
          {
            headers: {
              'x-internal-secret': process.env.INTERNAL_API_SECRET || '',
            },
          },
        ),
      );

      if (fetchError || !file?.ok) {
        notSaved.push(files[i]);
        this.logger.error(
          'File fetch failed: ',
          fetchError?.message || `HTTP ${file?.status}`,
        );
        continue;
      }

      const today = new Date().toISOString().split('T')[0];
      const key = `${today}/${userId}/${fileName}`;

      const { data: fileKey, error } = await tryCatch(
        this.uploadFile(Buffer.from(await file.arrayBuffer()), key),
      );

      if (error || !fileKey) {
        notSaved.push(files[i]);
        this.logger.error('File storage failed: ', error?.message);
        continue;
      }

      keys.push(fileKey);
    }

    return { notSaved, keys };
  }
}
