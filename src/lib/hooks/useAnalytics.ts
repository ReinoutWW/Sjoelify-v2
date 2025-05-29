import { useCallback } from 'react';
import {
  logEvent,
  logGameStarted,
  logGameEnded,
  logRoundCompleted,
  logUserSignUp,
  logUserLogin,
  logUserLogout,
  logFeatureUsed,
  logError,
  setAnalyticsUserId,
  setAnalyticsUserProperties,
  AnalyticsEvents,
} from '../analytics';

export function useAnalytics() {
  // Wrapped functions to ensure they're stable references
  const trackEvent = useCallback((eventName: string, parameters?: Record<string, any>) => {
    logEvent(eventName, parameters);
  }, []);

  const trackGameStarted = useCallback((gameMode?: string, players?: number) => {
    logGameStarted(gameMode, players);
  }, []);

  const trackGameEnded = useCallback((winner?: string, finalScores?: Record<string, number>, duration?: number) => {
    logGameEnded(winner, finalScores, duration);
  }, []);

  const trackRoundCompleted = useCallback((roundNumber: number, scores?: Record<string, number>) => {
    logRoundCompleted(roundNumber, scores);
  }, []);

  const trackUserSignUp = useCallback((method: string) => {
    logUserSignUp(method);
  }, []);

  const trackUserLogin = useCallback((method: string) => {
    logUserLogin(method);
  }, []);

  const trackUserLogout = useCallback(() => {
    logUserLogout();
  }, []);

  const trackFeatureUsed = useCallback((featureName: string, details?: Record<string, any>) => {
    logFeatureUsed(featureName, details);
  }, []);

  const trackError = useCallback((errorType: string, errorMessage: string, errorStack?: string) => {
    logError(errorType, errorMessage, errorStack);
  }, []);

  const setUserId = useCallback((userId: string | null) => {
    setAnalyticsUserId(userId);
  }, []);

  const setUserProperties = useCallback((properties: Record<string, any>) => {
    setAnalyticsUserProperties(properties);
  }, []);

  return {
    trackEvent,
    trackGameStarted,
    trackGameEnded,
    trackRoundCompleted,
    trackUserSignUp,
    trackUserLogin,
    trackUserLogout,
    trackFeatureUsed,
    trackError,
    setUserId,
    setUserProperties,
    AnalyticsEvents,
  };
} 