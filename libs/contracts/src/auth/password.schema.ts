import { z } from 'zod';

export const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol';

export const PasswordSchema = z
  .string()
  .min(8, PASSWORD_POLICY_MESSAGE)
  .regex(/[A-Z]/, PASSWORD_POLICY_MESSAGE)
  .regex(/[a-z]/, PASSWORD_POLICY_MESSAGE)
  .regex(/[0-9]/, PASSWORD_POLICY_MESSAGE)
  .regex(/[^A-Za-z0-9]/, PASSWORD_POLICY_MESSAGE);

export type Password = z.infer<typeof PasswordSchema>;
