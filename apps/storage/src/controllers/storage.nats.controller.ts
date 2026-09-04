import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { StorageService } from '../storage.service';
import {
  StoragePatterns,
  UploadPhotoPayload,
  SignedUrlPayload,
  SignedUrlsPayload,
  PresignedUploadPayload,
  PresignedUploadResponse,
  DeleteFilesSchema,
  validateSchema,
} from 'contracts';
import { toBuffer } from 'nowhere-common';

@Controller()
export class StorageNatsController {
  constructor(private readonly storageService: StorageService) {}

  @MessagePattern(StoragePatterns.UPLOAD_PHOTO)
  async uploadPhoto(
    @Payload() data: UploadPhotoPayload,
  ): Promise<{ key: string }> {
    const key = await this.storageService.uploadPhoto(
      toBuffer(data.image),
      data.userId,
    );
    return { key };
  }

  @MessagePattern(StoragePatterns.GET_SIGNED_URL)
  async getSignedUrl(
    @Payload() data: SignedUrlPayload,
  ): Promise<{ signed: string }> {
    const signed = await this.storageService.getSignedUrlForFile(data.key);
    return { signed };
  }

  @MessagePattern(StoragePatterns.GET_SIGNED_URLS)
  async getSignedUrls(
    @Payload() data: SignedUrlsPayload,
  ): Promise<{ urls: string[] }> {
    const urls = await this.storageService.getSignedUrls(data.keys);
    return { urls };
  }

  @MessagePattern(StoragePatterns.GET_PRESIGNED_UPLOAD)
  async getPresignedUpload(
    @Payload() data: PresignedUploadPayload,
  ): Promise<PresignedUploadResponse> {
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

  @MessagePattern(StoragePatterns.DELETE_FILES)
  async deleteFiles(@Payload() data: unknown): Promise<void> {
    const payload = validateSchema(DeleteFilesSchema, data);
    await this.storageService.deleteFiles(payload.keys);
  }
}
