import z from 'zod';
import { idSchema, passwordSchema, usernameSchema } from './base.schema.js';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}

export const UserRoleSchema = z.enum(UserRole);

export const UserRegisterSchema = z.object({
  username: usernameSchema,
  email: z.email().optional(),
  password: passwordSchema,
});

export const UserSchema = z.object({
  id: idSchema,
  email: z.email(),
  username: usernameSchema,
});

export const UserFullSchema = UserSchema.extend({
  role: UserRoleSchema,
  is2faEnabled: z.boolean(),
  oauthEmail: z.email().nullable(),
  createdAt: z.date(),
});

export const UserLoginSchema = z.union([
  z.object({
    username: usernameSchema,
    password: z.string(),
  }),
  z.object({
    email: z.email(),
    password: z.string(),
  }),
]);

// inferred DTOs
export type UserDTO = z.output<typeof UserSchema>;
export type UserFullDTO = z.output<typeof UserFullSchema>;
export type UserRegisterDTO = z.output<typeof UserRegisterSchema>;
export type UserLoginDTO = z.output<typeof UserLoginSchema>;
