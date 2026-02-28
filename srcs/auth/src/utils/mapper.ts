import { UserDTO, UserFullDTO } from '@transcendence/core';
import type { UserRow } from '../types/dto.ts';

export function toUserDTO(row: UserRow): UserDTO {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
  };
}

export function toFullUserDTO(row: UserRow): UserFullDTO {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    is2faEnabled: row.is_2fa_enabled === 1,
    oauthEmail: row.oauth_email,
    createdAt: new Date(row.created_at),
  };
}
