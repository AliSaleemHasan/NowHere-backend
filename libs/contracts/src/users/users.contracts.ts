import { z } from 'zod';

// ── Message Patterns ──
export const UsersPatterns = {
  GET_SETTINGS: 'users.getSettings',
  CREATE_USER_INFO: 'users.createUserInfo',
  GET_ALL_USERS_INFO: 'users.getAllUsersInfo',
  GET_USER_BY_ID: 'users.getUserById',
  GET_USER_BY_EMAIL: 'users.getUserByEmail',
  SET_USER_PHOTO: 'users.setUserPhoto',
  SET_SEEN_SNAP: 'users.setSeenSnap',
  NOT_SEEN_SNAPS: 'users.notSeenSnaps',
} as const;

export enum ROLES {
  ADMIN,
  USER,
}

// ── Schemas & Types ──
export const CreateUserInfoSchema = z.object({
  authId: z.string(),
  email: z.email(),
  firstName: z.string(),
  lastName: z.string(),
  bio: z.string().optional().default(''),
});
export type CreateUserInfoPayload = z.infer<typeof CreateUserInfoSchema>;

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  bio?: string;
  image?: string;
  isActive?: boolean;
  role?: ROLES;
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
