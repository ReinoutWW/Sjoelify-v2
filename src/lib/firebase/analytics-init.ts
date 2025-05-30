import { Analytics, getAnalytics, isSupported, logEvent as firebaseLogEvent } from 'firebase/analytics';
import { FirebaseApp } from 'firebase/app';

let analyticsInstance: Analytics | null = null;

export async function initializeAnalytics(app: FirebaseApp): Promise<Analytics | null> {
  // Only initialize in production and in browser
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
    console.log('Analytics not initialized: Not in production browser environment');
    return null;
  }

  try {
    // Check if Analytics is supported
    const supported = await isSupported();
    
    if (!supported) {
      console.log('Analytics not supported in this environment');
      return null;
    }

    // Initialize Analytics
    analyticsInstance = getAnalytics(app);
    console.log('Firebase Analytics initialized successfully');
    
    // Log initial page view
    firebaseLogEvent(analyticsInstance, 'page_view', {
      page_location: window.location.href,
      page_path: window.location.pathname,
      page_title: document.title
    });
    
    return analyticsInstance;
  } catch (error) {
    console.error('Failed to initialize Analytics:', error);
    return null;
  }
}

export function getAnalyticsInstance(): Analytics | null {
  return analyticsInstance;
}

// Helper function to safely log events
export function safeLogEvent(eventName: string, eventParams?: any) {
  if (analyticsInstance) {
    try {
      firebaseLogEvent(analyticsInstance, eventName, eventParams);
    } catch (error) {
      console.error(`Failed to log event ${eventName}:`, error);
    }
  }
} 