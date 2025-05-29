# Firebase Analytics Usage Guide

## Overview

Firebase Analytics has been integrated into the Sjoelify project to track user interactions, game events, and other important metrics. The implementation includes automatic page view tracking and custom event tracking for game-specific actions.

## Setup

Analytics is automatically initialized when Firebase is configured. It's disabled in development mode and when using Firebase emulators to avoid polluting your analytics data.

## Automatic Page View Tracking

Page views are automatically tracked whenever users navigate between pages. This is handled by the `AnalyticsProvider` component in the root layout.

## Using Analytics in Components

### Using the useAnalytics Hook

The easiest way to track events in your components is using the `useAnalytics` hook:

```typescript
import { useAnalytics } from '@/lib/hooks/useAnalytics';

function GameComponent() {
  const { trackGameStarted, trackGameEnded, trackRoundCompleted } = useAnalytics();
  
  const startGame = () => {
    // Your game logic
    trackGameStarted('classic', 4); // gameMode, numberOfPlayers
  };
  
  const endGame = (winner: string, scores: Record<string, number>) => {
    // Your game logic
    trackGameEnded(winner, scores, Date.now() - gameStartTime);
  };
  
  const completeRound = (roundNumber: number, roundScores: Record<string, number>) => {
    // Your round logic
    trackRoundCompleted(roundNumber, roundScores);
  };
  
  return (
    // Your component JSX
  );
}
```

### Available Tracking Methods

The `useAnalytics` hook provides the following methods:

- `trackEvent(eventName, parameters)` - Generic event tracking
- `trackGameStarted(gameMode?, players?)` - Track when a game starts
- `trackGameEnded(winner?, finalScores?, duration?)` - Track when a game ends
- `trackRoundCompleted(roundNumber, scores?)` - Track round completion
- `trackUserSignUp(method)` - Track user sign-ups
- `trackUserLogin(method)` - Track user logins
- `trackUserLogout()` - Track user logouts
- `trackFeatureUsed(featureName, details?)` - Track feature usage
- `trackError(errorType, errorMessage, errorStack?)` - Track errors
- `setUserId(userId)` - Set the user ID for analytics
- `setUserProperties(properties)` - Set user properties

### Direct Import Usage

You can also import analytics functions directly:

```typescript
import { logEvent, logFeatureUsed, AnalyticsEvents } from '@/lib/analytics';

// Track a custom event
logEvent('custom_event', {
  category: 'engagement',
  value: 42
});

// Track feature usage
logFeatureUsed('score_sharing', {
  platform: 'whatsapp',
  game_type: 'classic'
});
```

## Event Types

The following event types are predefined in `AnalyticsEvents`:

- `GAME_STARTED` - When a game begins
- `GAME_ENDED` - When a game ends
- `ROUND_COMPLETED` - When a round is completed
- `SCORE_RECORDED` - When a score is recorded
- `USER_SIGNED_UP` - When a user signs up
- `USER_LOGGED_IN` - When a user logs in
- `USER_LOGGED_OUT` - When a user logs out
- `PAGE_VIEW` - Automatic page view tracking
- `SCREEN_VIEW` - Screen view tracking
- `FEATURE_USED` - When a feature is used
- `SETTINGS_CHANGED` - When settings are changed
- `ERROR_OCCURRED` - When an error occurs

## Best Practices

1. **Track Meaningful Events**: Focus on events that provide insights into user behavior and game performance.

2. **Use Consistent Naming**: Use the predefined event types when possible, and follow a consistent naming convention for custom events.

3. **Include Relevant Parameters**: Add parameters that will help you analyze the data later:
   ```typescript
   trackFeatureUsed('game_mode_selected', {
     mode: 'tournament',
     player_count: 8,
     difficulty: 'hard'
   });
   ```

4. **Set User Properties**: Set user properties to segment your analytics:
   ```typescript
   const { setUserProperties } = useAnalytics();
   
   setUserProperties({
     preferred_game_mode: 'classic',
     skill_level: 'intermediate',
     games_played: 42
   });
   ```

5. **Error Tracking**: Use analytics to track errors for better debugging:
   ```typescript
   try {
     // Your code
   } catch (error) {
     trackError('game_error', error.message, error.stack);
   }
   ```

## Viewing Analytics Data

Analytics data can be viewed in the Firebase Console:

1. Go to the [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Analytics in the left sidebar
4. View real-time data, events, user properties, and more

## Privacy Considerations

- Analytics is only enabled in production builds
- No personally identifiable information (PII) should be sent to analytics
- User IDs should be anonymized identifiers, not email addresses or names
- Respect user privacy preferences if you implement an opt-out mechanism 