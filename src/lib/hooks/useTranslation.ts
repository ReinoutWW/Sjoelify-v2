'use client';

import { useLocale } from '@/lib/context/locale-context';
import { translations } from '@/lib/i18n/translations';
import { TranslationKey } from '@/lib/i18n/translations';

export function useTranslation() {
  const { locale } = useLocale();
  
  const t = translations[locale] as TranslationKey;
  
  return { t, locale };
}

// Helper function to interpolate variables in translation strings
export function interpolate(str: string, params: Record<string, string | number>): string {
  return str.replace(/{(\w+)}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
} 