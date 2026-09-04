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

export const ChangePasswordSchema = z.object({
  userId: z.string().min(1),
  currentPassword: z.string().min(1),
  newPassword: PasswordSchema,
});

export const ForgotPasswordSchema = z.object({
  email: z.email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: PasswordSchema,
});

export const DeactivateUserSchema = z.object({
  userId: z.string().min(1),
  password: z.string().min(1),
});

export const DeleteCredentialsSchema = z.object({
  userId: z.string().min(1),
});
