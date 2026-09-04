import { z } from 'zod';
import {
  BookmarkPayloadSchema,
  CreateReportSchema,
  CreateUserInfoSchema,
  ExportUserSchema,
  ListBookmarksSchema,
  PurgeUserSchema,
  ReportReasonSchema,
  UpdateProfileSchema,
  UpdateSettingsSchema,
} from './users.schemas';

// ── Message Patterns ──

export enum ROLES {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export function isAdminRole(role?: string): boolean {
  return role === ROLES.ADMIN;
}

// ── Schemas & Types ──

export type CreateUserInfoPayload = z.infer<typeof CreateUserInfoSchema>;
export type UpdateProfilePayload = z.infer<typeof UpdateProfileSchema>;
export type UpdateSettingsPayload = z.infer<typeof UpdateSettingsSchema>;

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  bio?: string;
  image?: string;
  isActive?: boolean;
  role?: ROLES | string;
}

export interface UserSettingsDto {
  id: string;
  user?: UserDto;
  maxDistance: number;
  newSnapDistance: number;
  snapDisappearTime: number;
}

export interface SeenObjectDto {
  snapId: string;
  userId: string;
}

export interface SeenObjectsDto {
  seen: SeenObjectDto[];
}

export interface NotSeenPayload {
  seen: boolean;
  userId: string;
  snapIds?: string[];
}

export interface SetSeenPayload {
  snapId: string;
  userId: string;
}

export type ReportReason = z.infer<typeof ReportReasonSchema>;
export type BookmarkPayload = z.infer<typeof BookmarkPayloadSchema>;
export type ListBookmarksPayload = z.infer<typeof ListBookmarksSchema>;
export type CreateReportPayload = z.infer<typeof CreateReportSchema>;
export type ExportUserPayload = z.infer<typeof ExportUserSchema>;
export type PurgeUserPayload = z.infer<typeof PurgeUserSchema>;

export interface ExportedSnapDto {
  id?: string;
  description?: string;
  snaps: string[];
  location?: unknown;
  tag?: string;
  status?: string;
  expiresAt?: Date | string;
  resolution?: string;
  resolutionNote?: string;
  resolvedBy?: string;
  resolvedAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  _userId?: string;
}

export interface UserExportDto {
  exportedAt: string;
  user: Pick<
    UserDto,
    'id' | 'email' | 'firstName' | 'lastName' | 'bio' | 'image'
  >;
  settings: Omit<UserSettingsDto, 'user'> | null;
  snaps: ExportedSnapDto[];
  seen: Array<SeenObjectDto & { seenAt?: Date | string }>;
  bookmarks: Array<{
    userId: string;
    snapId: string;
    createdAt?: Date | string;
  }>;
  reports: Array<{
    userId: string;
    snapId: string;
    reason: string;
    details?: string;
    createdAt?: Date | string;
  }>;
}
