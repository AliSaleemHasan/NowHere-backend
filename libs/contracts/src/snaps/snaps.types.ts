import { z } from 'zod';
import { CreateSnapSchema, FindNearSnapsSchema } from './snaps.schemas';

export type FindNearSnapsPayload = z.infer<typeof FindNearSnapsSchema>;
export type CreateSnapPayload = z.infer<typeof CreateSnapSchema>;
