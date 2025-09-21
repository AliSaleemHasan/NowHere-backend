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
import { ConfigService } from '@nestjs/config';
import { MICROSERVICES } from 'nowhere-common';
import { ClientProxy } from '@nestjs/microservices';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

// define redis client
@Injectable()
export class AwsStorageService {
  private logger = new Logger(AwsStorageService.name);
  private client: S3Client;
  private bucket: string;

  constructor(
    private config: ConfigService,
    @Inject(MICROSERVICES.STORAGE.package) private redisClient: ClientProxy,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
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
    // first check if file is in cahce
    let signedURL = await this.cacheManager.get(key);
    if (signedURL) return signedURL;

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: 'inline',
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
      try {
        let pathSeparator = files[i].path.split('/');
        let fileName = pathSeparator[pathSeparator.length - 1];

        // first get the file
        let file = await fetch(
          `${process.env.SNAPS_URL}/${process.env.STATIC_TMP_FILES}/${fileName}`,
        );

        if (!file.ok) {
          notSaved.push(files[i]);
          continue;
        }

        const fileKey = await this.uploadFile(
          Buffer.from(await file.arrayBuffer()),
          files[i].filename,
          userId,
        );

        keys.push(fileKey);
      } catch (e) {
        notSaved.push(files[i]);
        this.logger.error('file not uploaded correctly: ', e.message);
      }
    }

    return { notSaved, keys };
  }
}
