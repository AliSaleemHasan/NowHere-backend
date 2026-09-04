import { z } from 'zod';

export const MAX_DISTANCE_VALUES = [1000, 5000, 10000, 25000] as const;
export const NEW_SNAP_DISTANCE_VALUES = [250, 500, 1000, 2000] as const;
export const SNAP_DISAPPEAR_TIME_VALUES = [1, 3, 7] as const;

export const MaxDistanceSchema = z.literal(MAX_DISTANCE_VALUES);
export const NewSnapDistanceSchema = z.literal(NEW_SNAP_DISTANCE_VALUES);
export const SnapDisappearTimeSchema = z.literal(SNAP_DISAPPEAR_TIME_VALUES);

export type MaxDistance = z.infer<typeof MaxDistanceSchema>;
export type NewSnapDistance = z.infer<typeof NewSnapDistanceSchema>;
export type SnapDisappearTime = z.infer<typeof SnapDisappearTimeSchema>;
