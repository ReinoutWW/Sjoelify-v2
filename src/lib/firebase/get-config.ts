// Utility to get Firebase configuration from various sources
export function getFirebaseConfig() {
  // 1. Check for Firebase App Hosting environment variable (build time)
  if (process.env.FIREBASE_WEBAPP_CONFIG) {
    try {
      return JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG);
    } catch (e) {
      console.error('Failed to parse FIREBASE_WEBAPP_CONFIG:', e);
    }
  }

  // 2. Check for individual NEXT_PUBLIC environment variables (runtime)
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  // 3. If we're in production and don't have config, try hardcoded values as last resort
  // This ensures the build doesn't fail
  if (!config.apiKey && process.env.NODE_ENV === 'production') {
    return {
      apiKey: "AIzaSyAmKdvi5_KKPQjnl5fZIXAZII5AGN4yX3U",
      authDomain: "sjoelify.firebaseapp.com",
      projectId: "sjoelify",
      storageBucket: "sjoelify.firebasestorage.app",
      messagingSenderId: "434481685264",
      appId: "1:434481685264:web:9e94b20bd5d200136d3b95",
      measurementId: "G-FMLGYXTB30"
    };
  }

  return config;
} 