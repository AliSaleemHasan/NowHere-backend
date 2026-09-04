import { Tags } from 'nowhere-common';
import { SnapStatus } from './schemas/snap.schema';

export function activeSnapFilter(now: Date, tags?: Tags[]) {
  return {
    status: SnapStatus.SUCCESS,
    expiresAt: { $gt: now },
    ...(tags && tags.length > 0 ? { tag: { $in: tags } } : {}),
  };
}

export function ownedSnapsFilter(
  userId: string,
  includeExpired: boolean,
  now: Date,
) {
  return {
    _userId: userId,
    ...(!includeExpired ? { expiresAt: { $gt: now } } : {}),
  };
}
