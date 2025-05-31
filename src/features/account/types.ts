import { BaseEntity } from '@/shared/types';

export interface UserProfile extends BaseEntity {
  email: string;
  displayName: string;
  avatarUrl?: string;
  emailVerified: boolean;
  verified?: boolean; // Blue checkmark verification status
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
  privacy: 'public' | 'friends' | 'private';  // Who can view the profile
  shareStatistics: boolean;
  language: 'en' | 'nl';  // Supporting English and Dutch
  powerUser?: boolean;  // Enable power user features like auto-enable quick insert
} 