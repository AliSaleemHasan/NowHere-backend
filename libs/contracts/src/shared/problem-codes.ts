export const ProblemCodes = {
  SNAP_NOT_OWNED: 'SNAP_NOT_OWNED',
  IDEMPOTENT_REPLAY: 'IDEMPOTENT_REPLAY',
} as const;

export type ProblemCode = (typeof ProblemCodes)[keyof typeof ProblemCodes];
