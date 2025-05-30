'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, defaultLocale } from '@/lib/i18n/config';
import { useAuth } from '@/lib/context/auth-context';
import { UserSettingsService } from '@/features/account/services/user-settings-service';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'sjoelify-locale';

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const { user } = useAuth();

  // Load locale from localStorage or Firebase on mount
  useEffect(() => {
    const loadLocale = async () => {
      if (user?.uid) {
        // If user is authenticated, load from Firebase
        console.log('Loading language preference for user:', user.uid);
        try {
          const settings = await UserSettingsService.getUserSettings(user.uid);
          console.log('User settings from Firebase:', settings);
          if (settings?.language) {
            setLocaleState(settings.language as Locale);
            // Also update localStorage for consistency
            if (typeof window !== 'undefined') {
              localStorage.setItem(LOCALE_STORAGE_KEY, settings.language);
            }
          }
        } catch (error) {
          console.error('Error loading language preference from Firebase:', error);
          // Fall back to localStorage
          loadFromLocalStorage();
        }
      } else {
        // If not authenticated, load from localStorage
        loadFromLocalStorage();
      }
    };

    const loadFromLocalStorage = () => {
      if (typeof window !== 'undefined') {
        const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale;
        console.log('Loading language from localStorage:', savedLocale);
        if (savedLocale && (savedLocale === 'nl' || savedLocale === 'en')) {
          setLocaleState(savedLocale);
        }
      }
    };

    loadLocale();
  }, [user?.uid]);

  // Save locale to localStorage and Firebase when it changes
  const setLocale = async (newLocale: Locale) => {
    console.log('Setting new locale:', newLocale);
    setLocaleState(newLocale);
    
    // Always save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    }

    // If user is authenticated, also save to Firebase
    if (user?.uid) {
      console.log('Saving language preference to Firebase for user:', user.uid);
      try {
        await UserSettingsService.updateLanguagePreference(user.uid, newLocale);
        console.log('Language preference saved successfully');
      } catch (error) {
        console.error('Error saving language preference to Firebase:', error);
      }
    }
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
} 