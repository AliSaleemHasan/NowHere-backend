import { z } from 'zod';
import {
  MaxDistanceSchema,
  NewSnapDistanceSchema,
  SnapDisappearTimeSchema,
} from './settings-bounds';
import { MAX_REPORT_DETAILS } from '../shared/limits';

export const REPORT_REASONS = [
  'spam',
  'inappropriate',
  'wrong_place',
  'other',
] as const;

export const ReportReasonSchema = z.enum(REPORT_REASONS);

export const CreateUserInfoSchema = z.object({
  authId: z.string(),
  email: z.email(),
  firstName: z.string(),
  lastName: z.string(),
  bio: z.string().optional().default(''),
});

export const UpdateProfileSchema = z
  .object({
    userId: z.string().min(1),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    bio: z.string().optional(),
  })
  .refine(
    (value) =>
      value.firstName !== undefined ||
      value.lastName !== undefined ||
      value.bio !== undefined,
    { message: 'At least one of firstName, lastName, or bio is required' },
  );

export const UpdateSettingsSchema = z.object({
  userId: z.string().min(1),
  maxDistance: MaxDistanceSchema,
  newSnapDistance: NewSnapDistanceSchema,
  snapDisappearTime: SnapDisappearTimeSchema,
});

export const NotSeenSchema = z.object({
  seen: z.boolean().optional(),
  userId: z.string().min(1),
  snapIds: z.array(z.string()).optional(),
});

export const SetSeenSchema = z.object({
  snapId: z.string().min(1),
  userId: z.string().min(1),
});

export const UserIdPayloadSchema = z.object({
  id: z.string().min(1),
});

export const EmailPayloadSchema = z.object({
  email: z.email(),
});

export const BookmarkPayloadSchema = z.object({
  userId: z.string().min(1),
  snapId: z.string().min(1),
});

export const ListBookmarksSchema = z.object({
  userId: z.string().min(1),
});

export const CreateReportSchema = z.object({
  userId: z.string().min(1),
  snapId: z.string().min(1),
  reason: ReportReasonSchema,
  details: z.string().max(MAX_REPORT_DETAILS).optional(),
});
