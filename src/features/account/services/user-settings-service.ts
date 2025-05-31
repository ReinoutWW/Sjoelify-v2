import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { AccountSettings } from '../types';
import { Locale } from '@/lib/i18n/config';

export class UserSettingsService {
  private static readonly COLLECTION = 'userSettings';

  static async getUserSettings(userId: string): Promise<AccountSettings | null> {
    try {
      const docRef = doc(db, this.COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as AccountSettings;
      }
      
      // Return default settings if none exist
      return {
        privacy: 'public',
        shareStatistics: true,
        language: 'nl', // Default to Dutch
        powerUser: false,
        AIEnabled: false,
      };
    } catch (error) {
      console.error('Error fetching user settings:', error);
      return null;
    }
  }

  static async updateLanguagePreference(userId: string, language: Locale): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Update existing settings
        await updateDoc(docRef, { language });
      } else {
        // Create new settings document
        await setDoc(docRef, {
          privacy: 'public',
          shareStatistics: true,
          language,
          powerUser: false,
          AIEnabled: false,
        });
      }
    } catch (error) {
      console.error('Error updating language preference:', error);
      throw error;
    }
  }

  static async updateSettings(userId: string, settings: Partial<AccountSettings>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, settings);
      } else {
        // Create with defaults
        await setDoc(docRef, {
          privacy: 'public',
          shareStatistics: true,
          language: 'nl',
          powerUser: false,
          AIEnabled: false,
          ...settings,
        });
      }
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }
} 