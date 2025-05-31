import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider, getToken } from 'firebase/app-check';
import { getFirebaseConfig } from './get-config';
import { getAppCheckConfig } from './app-check-config';
import { initializeAnalytics } from './analytics-init';

// Get Firebase config from the centralized utility
const firebaseConfig = getFirebaseConfig();

// Initialize Firebase only if we have valid config
let app: any;
let auth: any;
let db: any;
let analytics: any;

if (firebaseConfig && firebaseConfig.apiKey) {
  app = initializeApp(firebaseConfig);
  
  // Initialize App Check (must be done before other services)
  if (typeof window !== 'undefined') {
    // Set debug token in development
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN) {
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN;
    }
    
    // Initialize App Check with ReCaptcha provider
    const recaptchaSiteKey = getAppCheckConfig();
    if (recaptchaSiteKey) {
      try {
        const appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(recaptchaSiteKey),
          isTokenAutoRefreshEnabled: true
        });
        console.log('Firebase App Check initialized successfully');
        
        // Force token refresh in production to test
        if (process.env.NODE_ENV === 'production') {
          getToken(appCheck, true).then(() => {
            console.log('App Check token obtained successfully');
          }).catch((error: any) => {
            console.error('Failed to get App Check token:', error);
          });
        }
      } catch (error) {
        console.error('Failed to initialize App Check:', error);
      }
    } else {
      console.warn('ReCAPTCHA site key not found - App Check not initialized');
    }
  }
  
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
    
    // Initialize Analytics only in production and in the browser
    if (process.env.NODE_ENV === 'production') {
      initializeAnalytics(app).then((analyticsInstance) => {
        analytics = analyticsInstance;
        if (analytics) {
          console.log('Analytics module initialized and ready');
        }
      });
    }
  }
} else {
  console.warn('Firebase config not available, some features may not work');
}

export { auth, db, analytics };
export default app; 