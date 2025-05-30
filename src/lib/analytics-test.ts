// Analytics Test File - Run this to verify Analytics is working
import { getAnalyticsInstance, safeLogEvent } from './firebase/analytics-init';

export function testAnalytics() {
  console.log('Testing Firebase Analytics...');
  
  const analytics = getAnalyticsInstance();
  
  if (!analytics) {
    console.error('Analytics is not initialized! This is normal in development mode.');
    console.log('Analytics only runs in production to avoid polluting your data.');
    return;
  }
  
  try {
    // Test logging an event using safe method
    safeLogEvent('test_event', {
      test_parameter: 'test_value',
      timestamp: new Date().toISOString()
    });
    
    console.log('Analytics test event sent successfully!');
    console.log('Analytics instance:', analytics);
    console.log('App instance:', analytics.app);
    console.log('Config:', analytics.app.options);
  } catch (error) {
    console.error('Error in analytics test:', error);
  }
} 