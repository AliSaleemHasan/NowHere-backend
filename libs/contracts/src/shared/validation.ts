import { z } from 'zod';

export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}
