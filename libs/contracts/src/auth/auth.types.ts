import { ROLES } from 'contracts/users';
import { z } from 'zod';
import { SignupSchema } from './auth.schemas';

// ── Message Patterns ──

// ── Payload Schemas & Types ──

export type SignupPayload = z.infer<typeof SignupSchema>;

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
