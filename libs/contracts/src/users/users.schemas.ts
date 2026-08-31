import { z } from 'zod';
export const CreateUserInfoSchema = z.object({
  authId: z.string(),
  email: z.email(),
  firstName: z.string(),
  lastName: z.string(),
  bio: z.string().optional().default(''),
});
