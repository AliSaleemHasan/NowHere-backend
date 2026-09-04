import { z } from 'zod';
import {
  CreateSnapSchema,
  DeleteByUserIdSchema,
  DeleteSnapSchema,
  FindByUserSchema,
  FindNearSnapsSchema,
  MarkFoundSchema,
  ReopenSnapSchema,
  SnapResolutionSchema,
} from './snaps.schemas';

export type FindNearSnapsPayload = z.infer<typeof FindNearSnapsSchema>;
export type CreateSnapPayload = z.infer<typeof CreateSnapSchema>;
export type DeleteSnapPayload = z.infer<typeof DeleteSnapSchema>;
export type FindByUserPayload = z.infer<typeof FindByUserSchema>;
export type DeleteByUserIdPayload = z.infer<typeof DeleteByUserIdSchema>;
export type MarkFoundPayload = z.infer<typeof MarkFoundSchema>;
export type ReopenSnapPayload = z.infer<typeof ReopenSnapSchema>;
export type SnapResolution = z.infer<typeof SnapResolutionSchema>;
