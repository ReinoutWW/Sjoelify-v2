import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFirebaseConfig } from './firebase/get-config';

// Get Firebase config from the centralized utility
const firebaseConfig = getFirebaseConfig();

// Initialize Firebase only if we have a valid config
let app: any;
let db: any;
let auth: any;

if (firebaseConfig && firebaseConfig.apiKey) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
} else {
  console.warn('Firebase config not available, some features may not work');
}

export { db, auth }; 