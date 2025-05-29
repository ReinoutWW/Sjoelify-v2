import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator } from 'firebase/firestore';
import { getFirebaseConfig } from './get-config';

// Get Firebase config from the centralized utility
const firebaseConfig = getFirebaseConfig();

// Initialize Firebase only if we have valid config
let app: any;
let auth: any;
let db: any;

if (firebaseConfig && firebaseConfig.apiKey) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Track if emulators are connected
  let emulatorsStarted = false;

  // Connect to emulators in development
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' && !emulatorsStarted) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, 'localhost', 8081);
      emulatorsStarted = true;
      console.log('Firebase Emulators connected successfully');
    } catch (error) {
      console.error('Failed to connect to Firebase Emulators:', error);
    }
  }

  // Enable offline persistence only if not using emulators and in browser environment
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR !== 'true') {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.log('Persistence failed: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        // The current browser doesn't support persistence
        console.log('Persistence not supported by browser');
      }
    });
  }
} else {
  console.warn('Firebase config not available, some features may not work');
}

export { auth, db };
export default app; 