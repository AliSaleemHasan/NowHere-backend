import { z } from 'zod';

export const DeleteFilesSchema = z.object({
  keys: z.array(z.string().min(1)),
});
