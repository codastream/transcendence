import z from 'zod';
import { usernameSchema } from './base.schema.js';

export const UserNameSchema = z.object({
  username: usernameSchema,
});

export interface UserRequestDTO {
  id: number;
  username: string;
  role?: string;
  email?: string;
}

export type UserNameDTO = z.output<typeof UserNameSchema>;

export enum USER_EVENT {
  CREATED = 'USER_CREATED',
  UPDATED = 'USER_UPDATED',
  DELETED = 'USER_DELETED',
}

export interface UserEvent {
  type: USER_EVENT;
  id: number;
  username: string;
  avatar?: string;
  timestamp: number;
}
