import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { MAX_UPLOAD_BATCH } from 'contracts';

export { MAX_UPLOAD_BATCH };

export const ALLOWED_UPLOAD_PREFIXES = ['snaps', 'profile'] as const;
export type UploadPrefix = (typeof ALLOWED_UPLOAD_PREFIXES)[number];

export const ALLOWED_IMAGE_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

const SAFE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

export function normalizeUploadPrefix(prefix?: string): UploadPrefix {
  return prefix === 'profile' ? 'profile' : 'snaps';
}

export function assertAllowedContentType(contentType?: string): string {
  const raw = (contentType || 'image/jpeg').toLowerCase().trim();
  const normalized = raw === 'image/jpg' ? 'image/jpeg' : raw;
  if (
    !ALLOWED_IMAGE_CONTENT_TYPES.includes(
      normalized as (typeof ALLOWED_IMAGE_CONTENT_TYPES)[number],
    )
  ) {
    throw new BadRequestException(
      'Unsupported content type. Allowed: image/jpeg, image/png, image/webp',
    );
  }
  return normalized;
}

export function sanitizeFileExtension(filename?: string): string {
  const ext = (filename?.split('.').pop() || 'jpg')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  if (!SAFE_EXTENSIONS.has(ext)) {
    return 'jpg';
  }
  return ext === 'jpeg' ? 'jpg' : ext;
}

export function buildOwnedObjectKey(params: {
  prefix?: string;
  userId: string;
  filename?: string;
}): string {
  if (!params.userId) {
    throw new BadRequestException('Authenticated user is required');
  }
  const prefix = normalizeUploadPrefix(params.prefix);
  const ext = sanitizeFileExtension(params.filename);
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  if (prefix === 'profile') {
    return `profile/${params.userId}/${unique}.${ext}`;
  }
  const today = new Date().toISOString().split('T')[0];
  return `snaps/${today}/${params.userId}/${unique}.${ext}`;
}

export function assertSafeObjectKey(key: string): void {
  if (
    !key ||
    typeof key !== 'string' ||
    key.includes('..') ||
    key.includes('\\') ||
    key.includes('\0') ||
    key.startsWith('/') ||
    key.includes('://')
  ) {
    throw new ForbiddenException('Invalid object key');
  }
}

export function isOwnedObjectKey(key: string, userId: string): boolean {
  try {
    assertSafeObjectKey(key);
  } catch {
    return false;
  }
  const parts = key.split('/').filter(Boolean);
  if (parts[0] === 'snaps') {
    // snaps/{date}/{userId}/{file}
    return parts.length >= 4 && parts[2] === userId;
  }
  if (parts[0] === 'profile') {
    // profile/{userId} or profile/{userId}/{file}
    return parts.length >= 2 && parts[1] === userId;
  }
  return false;
}

export function assertOwnedObjectKey(
  key: string,
  userId: string,
  isAdmin = false,
): void {
  assertSafeObjectKey(key);
  if (isAdmin) {
    return;
  }
  if (!isOwnedObjectKey(key, userId)) {
    throw new ForbiddenException('Object key is not owned by the caller');
  }
}

export function assertProfileImageKey(key: string, userId: string): void {
  assertOwnedObjectKey(key, userId);
  const parts = key.split('/').filter(Boolean);
  if (parts[0] !== 'profile') {
    throw new ForbiddenException('Object key is not a profile image');
  }
}

export function assertSnapImageKeys(keys: string[], userId: string): void {
  if (
    !Array.isArray(keys) ||
    keys.length < 1 ||
    keys.length > MAX_UPLOAD_BATCH
  ) {
    throw new BadRequestException(
      `Provide between 1 and ${MAX_UPLOAD_BATCH} uploaded image keys`,
    );
  }
  for (const key of keys) {
    assertSafeObjectKey(key);
    const parts = key.split('/').filter(Boolean);
    if (parts[0] !== 'snaps' || parts[2] !== userId) {
      throw new ForbiddenException(
        'Snap image key is not owned by the caller',
      );
    }
  }
}
