import * as z from 'zod';
import { AUTH_CONFIG } from '../config/auth.js';

// camelCase for fields : idSchema
// PascalCase for Objects : IdSchema

export const usernameSchema = z
  .string()
  .min(4, 'Username must be at least 4 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username must contain only letters, numbers and underscores')
  .refine((val: string) => !val.includes('admin'), {
    message: "Username cannot contain 'admin'",
  });

export const nicknameSchema = z
  .string()
  .min(2, 'Nickname must be at least 2 characters')
  .max(20, 'Nickname must be at most 20 characters');

export const passwordSchema = z
  .string()
  .min(
    AUTH_CONFIG.PASSWORD_MIN_LENGTH,
    `Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters`,
  )
  .max(AUTH_CONFIG.PASSWORD_MAX_LENGTH, 'Password too long')
  .regex(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
  .regex(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
  .regex(/^(?=.*\d)/, 'Password must contain at least one number')
  .regex(/^(?=.*[!@#$%^&*])/, 'Password must contain at least one special character (!@#$%^&*)');

export const roleSchema = z.enum(['user', 'moderator', 'admin']);

export const emailSchema = z.email();

export const idSchema = z.coerce.number().int().min(1, 'ID must be positive');

export const statusUpdateSchema = z.enum(['ACCEPTED', 'REJECTED']);

export const IdSchema = z.object({
  id: idSchema,
});

export const TargetUserIdSchema = z.object({
  targetUserId: idSchema,
});

export type statusUpdateDTO = z.output<typeof statusUpdateSchema>;
export type usernameDTO = z.output<typeof usernameSchema>;
export type emailDTO = z.output<typeof emailSchema>;
export type idDTO = z.output<typeof idSchema>;

export type IdDTO = z.output<typeof IdSchema>;
export type RoleDTO = z.output<typeof roleSchema>;
export type TargetUserIdDTO = z.output<typeof TargetUserIdSchema>;
