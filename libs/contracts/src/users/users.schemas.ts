import { z } from 'zod';
export const CreateUserInfoSchema = z.object({
  authId: z.string(),
  email: z.email(),
  firstName: z.string(),
  lastName: z.string(),
  bio: z.string().optional().default(''),
});

export const NotSeenSchema = z.object({
  seen: z.boolean().optional(),
  userId: z.string().min(1),
  snapIds: z.array(z.string()).optional(),
});

export const SetSeenSchema = z.object({
  snapId: z.string().min(1),
  userId: z.string().min(1),
});

export const UserIdPayloadSchema = z.object({
  id: z.string().min(1),
});
