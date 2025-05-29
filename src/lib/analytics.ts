import { logEvent as firebaseLogEvent, setUserId, setUserProperties, Analytics } from 'firebase/analytics';
import { analytics } from './firebase';

// Custom event types for your application
export enum AnalyticsEvents {
  // Game events
  GAME_STARTED = 'game_started',
  GAME_ENDED = 'game_ended',
  ROUND_COMPLETED = 'round_completed',
  SCORE_RECORDED = 'score_recorded',
  
  // User events
  USER_SIGNED_UP = 'user_signed_up',
  USER_LOGGED_IN = 'user_logged_in',
  USER_LOGGED_OUT = 'user_logged_out',
  
  // Navigation events
  PAGE_VIEW = 'page_view',
  SCREEN_VIEW = 'screen_view',
  
  // Feature usage
  FEATURE_USED = 'feature_used',
  SETTINGS_CHANGED = 'settings_changed',
  
  // Errors
  ERROR_OCCURRED = 'error_occurred',
}

// Helper to check if analytics is available
const isAnalyticsAvailable = (): boolean => {
  return typeof window !== 'undefined' && analytics !== undefined && analytics !== null;
};

// Generic event logging
export const logEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (isAnalyticsAvailable() && analytics) {
    try {
      firebaseLogEvent(analytics, eventName, parameters);
    } catch (error) {
      console.error('Failed to log analytics event:', error);
    }
  }
};

// Log page views
export const logPageView = (pageName: string, pageLocation?: string) => {
  logEvent(AnalyticsEvents.PAGE_VIEW, {
    page_title: pageName,
    page_location: pageLocation || window.location.href,
    page_path: window.location.pathname,
  });
};

// Log game events
export const logGameStarted = (gameMode?: string, players?: number) => {
  logEvent(AnalyticsEvents.GAME_STARTED, {
    game_mode: gameMode,
    number_of_players: players,
  });
};

export const logGameEnded = (winner?: string, finalScores?: Record<string, number>, duration?: number) => {
  logEvent(AnalyticsEvents.GAME_ENDED, {
    winner,
    final_scores: finalScores,
    game_duration: duration,
  });
};

export const logRoundCompleted = (roundNumber: number, scores?: Record<string, number>) => {
  logEvent(AnalyticsEvents.ROUND_COMPLETED, {
    round_number: roundNumber,
    round_scores: scores,
  });
};

// Log user events
export const logUserSignUp = (method: string) => {
  logEvent(AnalyticsEvents.USER_SIGNED_UP, {
    sign_up_method: method,
  });
};

export const logUserLogin = (method: string) => {
  logEvent(AnalyticsEvents.USER_LOGGED_IN, {
    login_method: method,
  });
};

export const logUserLogout = () => {
  logEvent(AnalyticsEvents.USER_LOGGED_OUT);
};

// Log feature usage
export const logFeatureUsed = (featureName: string, details?: Record<string, any>) => {
  logEvent(AnalyticsEvents.FEATURE_USED, {
    feature_name: featureName,
    ...details,
  });
};

// Log errors
export const logError = (errorType: string, errorMessage: string, errorStack?: string) => {
  logEvent(AnalyticsEvents.ERROR_OCCURRED, {
    error_type: errorType,
    error_message: errorMessage,
    error_stack: errorStack,
  });
};

// Set user ID for analytics
export const setAnalyticsUserId = (userId: string | null) => {
  if (isAnalyticsAvailable() && analytics) {
    try {
      setUserId(analytics, userId);
    } catch (error) {
      console.error('Failed to set user ID:', error);
    }
  }
};

// Set user properties
export const setAnalyticsUserProperties = (properties: Record<string, any>) => {
  if (isAnalyticsAvailable() && analytics) {
    try {
      setUserProperties(analytics, properties);
    } catch (error) {
      console.error('Failed to set user properties:', error);
    }
  }
}; 