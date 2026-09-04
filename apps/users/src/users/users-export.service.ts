import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ExportedSnapDto,
  ExportUserPayload,
  SnapsPatterns,
  UserExportDto,
} from 'contracts';
import { NATS_CLIENT, natsRequest } from 'nowhere-common';
import { BookmarksService } from './bookmarks.service';
import { ReportsService } from './reports.service';
import { UsersService } from './users.service';
import { UsersSettingsService } from '../settings/users-settings.service';

@Injectable()
export class UsersExportService {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersSettings: UsersSettingsService,
    private readonly bookmarksService: BookmarksService,
    private readonly reportsService: ReportsService,
    @Inject(NATS_CLIENT) private readonly natsClient: ClientProxy,
  ) {}

  async exportUser(payload: ExportUserPayload): Promise<UserExportDto> {
    const user = await this.usersService.getUserById(payload.userId);
    const [settings, seen, bookmarks, reports, snapsRaw] = await Promise.all([
      this.usersSettings.findSettings(payload.userId),
      this.usersService.getSeen({ userId: payload.userId }),
      this.bookmarksService.listBookmarks(payload.userId),
      this.reportsService.listByUser(payload.userId),
      natsRequest<unknown[]>(this.natsClient, SnapsPatterns.FIND_BY_USER, {
        userId: payload.userId,
        includeExpired: true,
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio,
        image: user.image,
      },
      settings,
      snaps: (Array.isArray(snapsRaw) ? snapsRaw : []).map(snapToExport),
      seen: seen.map((row) => ({
        snapId: row.snapId,
        userId: row.userId,
        seenAt: row.seenAt,
      })),
      bookmarks: bookmarks.map((row) => ({
        userId: row.userId,
        snapId: row.snapId,
        createdAt: row.createdAt,
      })),
      reports: reports.map((row) => ({
        userId: row.userId,
        snapId: row.snapId,
        reason: row.reason,
        details: row.details,
        createdAt: row.createdAt,
      })),
    };
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function snapToExport(raw: unknown): ExportedSnapDto {
  const source = asRecord(raw);
  const nested = source ? asRecord(source.snap) : null;
  const doc = nested ?? source ?? {};
  const id = snapIdOf(doc.id ?? doc._id);
  const snaps = Array.isArray(doc.snaps)
    ? doc.snaps.filter((key): key is string => typeof key === 'string')
    : [];
  return {
    id,
    description:
      typeof doc.description === 'string' ? doc.description : undefined,
    snaps,
    location: doc.location,
    tag: typeof doc.tag === 'string' ? doc.tag : undefined,
    status: typeof doc.status === 'string' ? doc.status : undefined,
    expiresAt: asDateLike(doc.expiresAt),
    resolution: typeof doc.resolution === 'string' ? doc.resolution : undefined,
    resolutionNote:
      typeof doc.resolutionNote === 'string' ? doc.resolutionNote : undefined,
    resolvedBy: typeof doc.resolvedBy === 'string' ? doc.resolvedBy : undefined,
    resolvedAt: asDateLike(doc.resolvedAt),
    createdAt: asDateLike(doc.createdAt),
    updatedAt: asDateLike(doc.updatedAt),
    _userId: typeof doc._userId === 'string' ? doc._userId : undefined,
  };
}

function snapIdOf(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return undefined;
}

function asDateLike(value: unknown): Date | string | undefined {
  if (value instanceof Date || typeof value === 'string') {
    return value;
  }
  return undefined;
}
