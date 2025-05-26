import { BaseEntity } from '@/shared/types';

export interface UserProfile extends BaseEntity {
  email: string;
  displayName: string;
  avatarUrl?: string;
  emailVerified: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  displayName: string;
}

export interface AccountSettings {
  emailNotifications: boolean;
  shareStatistics: boolean;
  language: 'en' | 'nl';  // Supporting English and Dutch
} 