import { z } from 'zod';
import {
  CreateSnapSchema,
  DeleteSnapSchema,
  FindByUserSchema,
  FindNearSnapsSchema,
} from './snaps.schemas';

export type FindNearSnapsPayload = z.infer<typeof FindNearSnapsSchema>;
export type CreateSnapPayload = z.infer<typeof CreateSnapSchema>;
export type DeleteSnapPayload = z.infer<typeof DeleteSnapSchema>;
export type FindByUserPayload = z.infer<typeof FindByUserSchema>;
