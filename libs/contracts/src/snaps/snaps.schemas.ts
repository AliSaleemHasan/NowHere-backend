import { z } from 'zod';
import { MAX_RESOLUTION_NOTE, MAX_UPLOAD_BATCH } from '../shared/limits';
import { StringListQuerySchema } from '../shared/query-list';

export const SNAP_RESOLUTIONS = ['OPEN', 'FOUND'] as const;
export const SnapResolutionSchema = z.enum(SNAP_RESOLUTIONS);

export const CreateSnapSchema = z.object({
  userId: z.string().min(1),
  description: z.string().optional(),
  location: z.union([
    z.object({
      type: z.literal('Point'),
      coordinates: z.tuple([z.number(), z.number()]),
    }),
    z.string().min(1),
  ]),
  snaps: z.array(z.string().min(1)).min(1).max(MAX_UPLOAD_BATCH),
  tag: z.string().optional(),
  idempotencyKey: z.uuid().optional(),
});

export const FindNearSnapsSchema = z.object({
  userId: z.string().min(1),
  lng: z.union([z.number(), z.string()]),
  lat: z.union([z.number(), z.string()]),
  tags: StringListQuerySchema,
  maxDistance: z.number().optional(),
});

export const SnapIdPayloadSchema = z.object({
  id: z.string().min(1),
  userId: z.string().optional(),
});

export const DeleteSnapSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  role: z.string().min(1),
});

export const FindByUserSchema = z.object({
  userId: z.string().min(1),
  includeExpired: z.boolean().optional(),
});

export const DeleteByUserIdSchema = z.object({
  userId: z.string().min(1),
});

export const MarkFoundSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  note: z.string().max(MAX_RESOLUTION_NOTE).optional(),
});

export const ReopenSnapSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
});
