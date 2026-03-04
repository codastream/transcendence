import { UserDTO, UserFullDTO } from '@transcendence/core';
import { DBUser } from 'src/types/models.js';

export function toUserDTO(row: DBUser): UserDTO {
  return {
    id: row.id || 0,
    username: row.username,
    email: row.email || '',
  };
}

export function toFullUserDTO(row: DBUser): UserFullDTO {
  return {
    id: row.id || 0,
    username: row.username,
    email: row.email || '',
    role: row.role || '',
    is2faEnabled: row.is_2fa_enabled === 1,
    oauthEmail: row.oauth_email || '',
    createdAt: row?.created_at ? new Date(row?.created_at) : new Date(),
  };
}
