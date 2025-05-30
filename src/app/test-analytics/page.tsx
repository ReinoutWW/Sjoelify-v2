'use client';

import { useEffect, useState } from 'react';
import { testAnalytics } from '@/lib/analytics-test';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from '@/lib/analytics';

export default function TestAnalyticsPage() {
  const [analyticsStatus, setAnalyticsStatus] = useState<string>('Checking...');
  const [events, setEvents] = useState<string[]>([]);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    // Check if analytics is initialized
    if (analytics) {
      setAnalyticsStatus('Analytics is initialized ✅');
      setConfig(analytics.app.options);
    } else {
      setAnalyticsStatus('Analytics is NOT initialized ❌');
    }

    // Test sending an event
    try {
      testAnalytics();
      addEvent('Test event sent via testAnalytics()');
    } catch (error) {
      addEvent(`Error: ${error}`);
    }
  }, []);

  const addEvent = (message: string) => {
    setEvents(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const sendTestEvent = () => {
    try {
      logEvent('test_button_click', {
        timestamp: new Date().toISOString(),
        page: 'test-analytics'
      });
      addEvent('Test button click event sent');
    } catch (error) {
      addEvent(`Error sending event: ${error}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Google Analytics Test Page</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-6">
        <h2 className="text-xl font-semibold mb-2">Status</h2>
        <p className="text-lg">{analyticsStatus}</p>
      </div>

      {config && (
        <div className="bg-gray-100 p-4 rounded mb-6">
          <h2 className="text-xl font-semibold mb-2">Firebase Configuration</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={sendTestEvent}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Send Test Event
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Event Log</h2>
        <div className="space-y-1">
          {events.map((event, index) => (
            <div key={index} className="text-sm font-mono">
              {event}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-100 rounded">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Open the browser's Developer Console (F12)</li>
          <li>Check the Network tab for any blocked requests</li>
          <li>Check the Console for any error messages</li>
          <li>Click "Send Test Event" and watch for errors</li>
          <li>If successful, you should see events in your Firebase Console after a few minutes</li>
        </ol>
      </div>
    </div>
  );
} 