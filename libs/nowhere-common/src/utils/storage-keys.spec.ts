import { ForbiddenException } from '@nestjs/common';
import {
  assertProfileImageKey,
  assertSnapImageKeys,
  isOwnedObjectKey,
} from './storage-keys';

describe('storage keys', () => {
  it('accepts profile/{userId} and profile/{userId}/{file}', () => {
    expect(isOwnedObjectKey('profile/u1', 'u1')).toBe(true);
    expect(isOwnedObjectKey('profile/u1/a.jpg', 'u1')).toBe(true);
    expect(isOwnedObjectKey('profile/u2/a.jpg', 'u1')).toBe(false);
  });

  it('assertProfileImageKey allows owned profile keys only', () => {
    expect(() => assertProfileImageKey('profile/u1/a.jpg', 'u1')).not.toThrow();
    expect(() =>
      assertProfileImageKey('snaps/2026-09-03/u1/a.jpg', 'u1'),
    ).toThrow(ForbiddenException);
  });

  it('assertSnapImageKeys rejects profile keys', () => {
    expect(() =>
      assertSnapImageKeys(['snaps/2026-09-03/u1/a.jpg'], 'u1'),
    ).not.toThrow();
    expect(() => assertSnapImageKeys(['profile/u1/a.jpg'], 'u1')).toThrow(
      ForbiddenException,
    );
  });
});
