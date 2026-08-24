export const STORAGE_STRATEGY = 'STORAGE_STRATEGY';

export interface PresignedUploadOptions {
  key: string;
  contentType?: string;
  expiresIn?: number;
}

export interface StorageStrategy {
  uploadFile(file: Buffer, key: string, contentType?: string): Promise<string>;
  getDownloadSignedUrl(key: string, expiresIn?: number): Promise<string>;
  getUploadSignedUrl(options: PresignedUploadOptions): Promise<string>;
  listFiles(prefix?: string): Promise<string[]>;
  deleteFile(key: string): Promise<void>;
}
