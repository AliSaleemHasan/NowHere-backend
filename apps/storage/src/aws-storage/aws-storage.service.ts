import {
  Injectable,
  Logger,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { S3Provider } from '../s3ObjectProvider/s3-object.provider';
import { tryCatch } from 'nowhere-common';

// define redis client
@Injectable()
export class AwsStorageService {
  private logger = new Logger(AwsStorageService.name);
  private client: S3Client;
  private bucket: string;

  constructor(
    private readonly awsService: S3Provider,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.client = this.awsService.getClient();
    this.bucket = this.awsService.getBucket();
  }

  async uploadFile(file: Buffer, key: string) {
    this.logger.log(`Uploading ${key} to S3...`);

    let { data, error } = await tryCatch(
      this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file,
        }),
      ),
    );

    if (error) {
      this.logger.error(`Upload failed: ${error.message}`);
      throw new InternalServerErrorException('File upload failed');
    }

    return key;
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
    // first check if file is in cahce
    let signedURL = await this.cacheManager.get(key);
    if (signedURL) return signedURL;

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: 'inline',
      ResponseContentType: 'image/png',
    });
    signedURL = await getSignedUrl(this.client, command, { expiresIn });
    await this.cacheManager.set(
      key,
      signedURL,
      Number(process.env.CACHE_TTL) || 86340,
    );

    return signedURL;
  }

  /**
   *
   * @param files List of files saved in (tmp folder)
   * @param keep
   */
  async saveLocalFiles(
    files: Array<Express.Multer.File>,
    userId: string,
    keep?: boolean,
  ) {
    // files will be in memory

    let notSaved: Array<Express.Multer.File> = [];

    let keys: string[] = [];

    for (let i = 0; i < files.length; i++) {
      let fileName = files[i].filename;

      let { data: file, error: fetchError } = await tryCatch(
        fetch(
          `${process.env.SNAPS_URL}/${process.env.STATIC_TMP_FILES}/${fileName}`,
        ),
      );

      if (fetchError) {
        notSaved.push(files[i]);
        this.logger.error(
          'file not uploaded correctly : (Fetch error) ',
          fetchError.message,
        );
      }
      // first get the file

      if (!file?.ok) {
        notSaved.push(files[i]);
        continue;
      }

      const today = new Date().toISOString().split('T')[0]; // safer format
      const key = `${today}/${userId}/${fileName}`;

      let { data: fileKey, error } = await tryCatch(
        this.uploadFile(Buffer.from(await file.arrayBuffer()), key),
      );
      if (error) {
        notSaved.push(files[i]);
        this.logger.error('file not uploaded correctly: ', error.message);
      }

      if (!fileKey) {
        this.logger.error(
          'File not uploaded correctly for some reason , returned data is empty!',
        );
        continue;
      }

      keys.push(fileKey);
    }

    return { notSaved, keys };
  }
}
