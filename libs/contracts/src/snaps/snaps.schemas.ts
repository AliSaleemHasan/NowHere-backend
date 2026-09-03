import { z } from 'zod';

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
  snaps: z.array(z.string().min(1)).min(1).max(4),
  tag: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const FindNearSnapsSchema = z.object({
  userId: z.string().min(1),
  lng: z.union([z.number(), z.string()]),
  lat: z.union([z.number(), z.string()]),
  tags: z.array(z.string()).optional(),
  maxDistance: z.number().optional(),
});

export const SnapIdPayloadSchema = z.object({
  id: z.string().min(1),
  userId: z.string().optional(),
});
