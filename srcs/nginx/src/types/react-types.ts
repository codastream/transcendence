import { ProfileSimpleDTO } from '@transcendence/core';
import { ReactNode } from 'react';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface UserAction {
  label: string;
  color?: string;
  icon: string;
}

export enum UserActions {
  PLAY = 'play',
  ADD = 'add',
  REMOVE = 'remove',
}

export enum MenuActions {
  HOME = 'home',
  PLAY = 'play',
  STATS = 'stats',
  PROFILE = 'profile',
}

export enum Roles {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

export interface AuthContextType {
  user: ProfileSimpleDTO | null;
  login: (user: ProfileSimpleDTO) => void;
  logout: () => void;
  updateUser: (newUser: ProfileSimpleDTO) => void;
}

export interface AuthProviderProps {
  children: ReactNode;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
}
