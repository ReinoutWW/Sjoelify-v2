export const locales = ['nl', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'nl';

export const languages = {
  nl: {
    name: 'Nederlands',
    flag: '🇳🇱',
  },
  en: {
    name: 'English',
    flag: '🇺🇸',
  },
} as const; 