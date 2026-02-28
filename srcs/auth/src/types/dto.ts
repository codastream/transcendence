import { UserRole } from '@transcendence/core';
export interface CreateProfileDTO {
  authId: number;
  email: string;
  username: string;
}

export interface UserProfileDTO {
  username: string;
  avatarUrl: string;
}

export interface UserRow {
  id: number;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  is_2fa_enabled: 0 | 1;
  totp_secret: string | null;
  google_id: string | null;
  school42_id: string | null;
  oauth_email: string | null;
  avatar_url: string | null;
  created_at: string;
}

// ============================================
// OAuth DTOs
// ============================================

/**
 * Données du profil utilisateur retournées par les providers OAuth
 */
export interface OAuthProfile {
  id: string; // ID unique chez le provider
  email: string; // Email principal
  name: string; // Nom complet
  avatarUrl?: string; // URL de l'avatar
  provider: 'google' | 'school42'; // Provider source
}
