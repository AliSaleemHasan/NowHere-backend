import { z } from 'zod';

/** Nest turns a single `?tags=LOST` into a string, and `?tags=a&tags=b` into an array. */
export function toStringList(value: unknown): string[] | undefined {
  if (value == null || value === '') return undefined;
  const parts = Array.isArray(value) ? value : [value];
  const list = parts
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return list.length > 0 ? list : undefined;
}

export const StringListQuerySchema = z.preprocess(
  toStringList,
  z.array(z.string()).optional(),
);
