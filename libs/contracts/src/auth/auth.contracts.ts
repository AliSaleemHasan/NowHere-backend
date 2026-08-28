import { ROLES } from '../users/users.contracts';
import { z } from 'zod';

// ── Message Patterns ──
export const AuthPatterns = {
  VALIDATE_USER: 'auth.validateUser',
  VALIDATE_TOKEN: 'auth.validateToken',
  SIGNUP: 'auth.signup',
  REFRESH_TOKEN: 'auth.refreshToken',
  // Events (JetStream durable)
  USER_CREDENTIALS_CREATED: 'auth.user.credentials.created',
} as const;

// ── Payload Schemas & Types ──
export const ValidateUserSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});
export type ValidateUserPayload = z.infer<typeof ValidateUserSchema>;

export const ValidateTokenSchema = z.object({
  token: z.string(),
});
export type ValidateTokenPayload = z.infer<typeof ValidateTokenSchema>;

export const SignupSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  role: z.enum(ROLES),
  firstName: z.string(),
  lastName: z.string(),
  username: z.string().optional(),
});
export type SignupPayload = z.infer<typeof SignupSchema>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUserDto {
  id: string;
  email: string;
  role: keyof typeof ROLES;
  isActive: boolean;
  lastLoginAt?: Date | string;
}

export interface AuthResponse {
  user: AuthUserDto;
  tokens: AuthTokens;
}

export interface UserCredentialsCreatedEvent {
  authId: string;
  email: string;
  firstName: string;
  lastName: string;
}
