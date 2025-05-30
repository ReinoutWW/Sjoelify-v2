import { nl } from './nl';
import { en } from './en';

export const translations = {
  nl,
  en,
} as const;

export type TranslationKey = typeof nl;
export type Translation = typeof translations; 