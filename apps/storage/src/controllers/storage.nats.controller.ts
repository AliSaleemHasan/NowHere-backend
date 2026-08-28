import { Controller, Inject, Logger } from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload, Ctx, NatsContext } from '@nestjs/microservices';
import { StorageService } from '../storage.service';
import {
  StoragePatterns,
  UploadPhotoPayload,
  SignedUrlPayload,
  SignedUrlsPayload,
  PresignedUploadPayload,
  PresignedUploadResponse,
  SnapUploadPayload,
  SnapUploadedEvent,
} from 'contracts';

@Controller()
export class StorageNatsController {
  private readonly logger = new Logger(StorageNatsController.name);

  constructor(
    private readonly storageService: StorageService,
    @Inject('NATS_CLIENT') private readonly natsClient: ClientProxy,
  ) {}

  @MessagePattern(StoragePatterns.UPLOAD_PHOTO)
  async uploadPhoto(@Payload() data: UploadPhotoPayload): Promise<{ key: string }> {
    let buffer: Buffer;
    if (Buffer.isBuffer(data.image)) {
      buffer = data.image;
    } else if (typeof data.image === 'object' && (data.image as any)?.data) {
      buffer = Buffer.from((data.image as any).data);
    } else if (typeof data.image === 'string') {
      buffer = Buffer.from(data.image, 'base64');
    } else {
      buffer = Buffer.from(data.image as any);
    }
    const key = await this.storageService.uploadPhoto(buffer, data.userId);
    return { key };
  }

  @MessagePattern(StoragePatterns.GET_SIGNED_URL)
  async getSignedUrl(@Payload() data: SignedUrlPayload): Promise<{ signed: string }> {
    const signed = await this.storageService.getSignedUrlForFile(data.key);
    return { signed };
  }

  @MessagePattern(StoragePatterns.GET_SIGNED_URLS)
  async getSignedUrls(@Payload() data: SignedUrlsPayload): Promise<{ urls: string[] }> {
    const urls = await this.storageService.getSignedUrls(data.keys);
    return { urls };
  }

  @MessagePattern(StoragePatterns.GET_PRESIGNED_UPLOAD)
  async getPresignedUpload(@Payload() data: PresignedUploadPayload): Promise<PresignedUploadResponse> {
    const result = await this.storageService.getPresignedUploadUrl(
      data.key,
      data.contentType,
      data.expiresIn,
    );
    return { uploadUrl: result.uploadUrl, key: result.key };
  }

  @MessagePattern(StoragePatterns.LIST_FILES)
  async listFiles(): Promise<string[]> {
    return await this.storageService.listFiles();
  }

  @MessagePattern(StoragePatterns.SNAP_UPLOAD)
  async handleSnapUpload(
    @Payload() data: SnapUploadPayload,
    @Ctx() context: NatsContext,
  ) {
    this.logger.log(`Storage service received snap upload message for snapId: ${data.snapId}`);

    const { keys, notSaved } = await this.storageService.saveLocalFiles(
      data.files as any,
      data.userId,
    );

    if (notSaved.length > 0) {
      const errorMessage = `Some files are not saved correctly: ${JSON.stringify(notSaved)}`;
      this.logger.error(errorMessage);

      this.natsClient.emit<void, SnapUploadedEvent>(StoragePatterns.SNAP_UPLOADED, {
        snapId: data.snapId,
        filesNames: data.files.map((file) => file.filename),
        error: errorMessage,
      });
      return { error: notSaved.length };
    }

    this.natsClient.emit<void, SnapUploadedEvent>(StoragePatterns.SNAP_UPLOADED, {
      snapId: data.snapId,
      filesNames: data.files.map((file) => file.filename),
      keys: keys,
    });

    return { keys, notSaved };
  }
}
