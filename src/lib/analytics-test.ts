// Analytics Test File - Run this to verify Analytics is working
import { analytics } from './firebase/config';
import { logEvent } from 'firebase/analytics';

export function testAnalytics() {
  console.log('Testing Firebase Analytics...');
  
  if (!analytics) {
    console.error('Analytics is not initialized!');
    return;
  }
  
  try {
    // Test logging an event
    logEvent(analytics, 'test_event', {
      test_parameter: 'test_value',
      timestamp: new Date().toISOString()
    });
    
    console.log('Analytics test event sent successfully!');
    console.log('Analytics instance:', analytics);
    console.log('App instance:', analytics.app);
    console.log('Config:', analytics.app.options);
  } catch (error) {
    console.error('Error sending analytics event:', error);
  }
} 