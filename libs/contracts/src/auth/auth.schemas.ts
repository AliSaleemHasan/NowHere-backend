import { z } from 'zod';
import { PasswordSchema } from './password.schema';

export const ValidateUserSchema = z.object({
  email: z.email(),
  password: z.string(),
});
export type ValidateUserPayload = z.infer<typeof ValidateUserSchema>;

export const ValidateTokenSchema = z.object({
  token: z.string(),
});
export type ValidateTokenPayload = z.infer<typeof ValidateTokenSchema>;

export const SignupSchema = z.object({
  email: z.email(),
  password: PasswordSchema,
  firstName: z.string(),
  lastName: z.string(),
  username: z.string().optional(),
});
