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
