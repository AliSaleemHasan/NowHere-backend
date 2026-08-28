import { z } from 'zod';

// ── Message Patterns ──
export const StoragePatterns = {
  UPLOAD_PHOTO: 'storage.uploadPhoto',
  GET_SIGNED_URL: 'storage.getSignedUrl',
  GET_SIGNED_URLS: 'storage.getSignedUrls',
  GET_PRESIGNED_UPLOAD: 'storage.getPresignedUpload',
  LIST_FILES: 'storage.listFiles',
  // Events (JetStream durable)
  SNAP_UPLOAD: 'storage.snap.upload',
  SNAP_UPLOADED: 'storage.snap.uploaded',
} as const;

export interface UploadPhotoPayload {
  image: Buffer | { type: string; data: number[] } | string;
  userId: string;
}

export interface SignedUrlPayload {
  key: string;
}

export interface SignedUrlsPayload {
  keys: string[];
}

export interface PresignedUploadPayload {
  key: string;
  contentType: string;
  expiresIn?: number;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  key: string;
}

export interface SnapUploadPayload {
  files: Array<{
    filename: string;
    originalname?: string;
    path?: string;
    buffer?: any;
    mimetype?: string;
  }>;
  userId: string;
  snapId: string;
}

export interface SnapUploadedEvent {
  snapId: string;
  filesNames: string[];
  keys?: string[];
  error?: string;
}
