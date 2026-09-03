import { z } from 'zod';
import { CreateUserInfoSchema } from './users.schemas';

// ── Message Patterns ──

export enum ROLES {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

// ── Schemas & Types ──

export type CreateUserInfoPayload = z.infer<typeof CreateUserInfoSchema>;

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  bio?: string;
  image?: string;
  isActive?: boolean;
  role?: ROLES | string;
}

export interface UserSettingsDto {
  id: string;
  user?: UserDto;
  maxDistance: number;
  newSnapDistance: number;
  snapDisappearTime: number;
}

export interface SeenObjectDto {
  snapId: string;
  userId: string;
}

export interface SeenObjectsDto {
  seen: SeenObjectDto[];
}

export interface NotSeenPayload {
  seen: boolean;
  userId: string;
  snapIds?: string[];
}

export interface SetSeenPayload {
  snapId: string;
  userId: string;
}
