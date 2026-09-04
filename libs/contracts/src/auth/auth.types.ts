import { ROLES } from 'contracts/users';
import { z } from 'zod';
import {
  ChangePasswordSchema,
  DeactivateUserSchema,
  DeleteCredentialsSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  SignupSchema,
} from './auth.schemas';

// ── Message Patterns ──

// ── Payload Schemas & Types ──

export type SignupPayload = z.infer<typeof SignupSchema>;
export type ChangePasswordPayload = z.infer<typeof ChangePasswordSchema>;
export type ForgotPasswordPayload = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordPayload = z.infer<typeof ResetPasswordSchema>;
export type DeactivateUserPayload = z.infer<typeof DeactivateUserSchema>;
export type DeleteCredentialsPayload = z.infer<typeof DeleteCredentialsSchema>;

export interface ForgotPasswordResult {
  accepted: true;
  devResetUrl?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUserDto {
  id: string;
  email: string;
  role: ROLES;
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

export interface JwtUserPayload {
  id: string;
  email: string;
  role: ROLES;
}

export interface JwtPayload {
  sub: string;
  user: JwtUserPayload;
}
