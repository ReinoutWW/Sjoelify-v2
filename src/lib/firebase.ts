import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFirebaseConfig } from './firebase/get-config';
import { auth as configAuth, db as configDb, analytics as configAnalytics } from './firebase/config';

// Check if we should use the config exports or initialize here
const useConfigExports = configAuth && configDb;

// Get Firebase config from the centralized utility
const firebaseConfig = getFirebaseConfig();

// Initialize Firebase only if we have a valid config and not using config exports
let app: any;
let db: any;
let auth: any;
let analytics: any;

if (useConfigExports) {
  // Use exports from config.ts
  auth = configAuth;
  db = configDb;
  analytics = configAnalytics;
} else if (firebaseConfig && firebaseConfig.apiKey) {
  // Fallback initialization
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
  
  // Initialize Analytics only in the browser environment
  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    });
  }
} else {
  console.warn('Firebase config not available, some features may not work');
}

export { db, auth, analytics }; 