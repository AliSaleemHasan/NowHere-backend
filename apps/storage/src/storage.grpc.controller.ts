import { Controller } from '@nestjs/common';
import {
  STORAGE_SERVICE_NAME,
  StorageServiceController,
  Key,
  Keys,
  SignedURL,
  SignedURLs,
  UploadImageDto,
  PresignedUploadRequest,
  PresignedUploadResponse,
} from 'proto';
import { GrpcMethod } from '@nestjs/microservices';
import { StorageService } from './storage.service';

@Controller()
export class StorageGrpcController implements StorageServiceController {
  constructor(private readonly storageService: StorageService) {}

  @GrpcMethod(STORAGE_SERVICE_NAME, 'uploadPhoto')
  async uploadPhoto(request: UploadImageDto): Promise<Key> {
    const key = await this.storageService.uploadPhoto(
      request.image as Buffer,
      request.userId,
    );
    return { key };
  }

  @GrpcMethod(STORAGE_SERVICE_NAME, 'getSignedURL')
  async getSignedUrl(request: Key): Promise<SignedURL> {
    const signed = await this.storageService.getSignedUrlForFile(request.key);
    return { signed };
  }

  @GrpcMethod(STORAGE_SERVICE_NAME, 'getSignedURLs')
  async getSignedUrLs(request: Keys): Promise<SignedURLs> {
    const urls = await this.storageService.getSignedUrls(request.keys);
    return { urls };
  }

  @GrpcMethod(STORAGE_SERVICE_NAME, 'getPresignedUploadURL')
  async getPresignedUploadUrl(
    request: PresignedUploadRequest,
  ): Promise<PresignedUploadResponse> {
    const result = await this.storageService.getPresignedUploadUrl(
      request.key,
      request.contentType,
      request.expiresIn,
    );
    return {
      uploadUrl: result.uploadUrl,
      key: result.key,
    };
  }
}
