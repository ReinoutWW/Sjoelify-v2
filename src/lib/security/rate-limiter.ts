import { RATE_LIMITS } from './config';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (client-side)
// In production, use Redis or similar for server-side rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

export class RateLimiter {
  /**
   * Check if an action is rate limited
   * @param key Unique identifier for the rate limit (e.g., 'auth:email@example.com')
   * @param limitConfig The rate limit configuration to use
   * @returns true if the action should be allowed, false if rate limited
   */
  static checkLimit(
    key: string,
    limitConfig: { windowMs: number; max: number }
  ): boolean {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    // Clean up old entries periodically
    if (rateLimitStore.size > 1000) {
      this.cleanup();
    }

    if (!entry || now > entry.resetTime) {
      // No entry or window has expired, create new entry
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + limitConfig.windowMs,
      });
      return true;
    }

    // Check if limit is exceeded
    if (entry.count >= limitConfig.max) {
      return false;
    }

    // Increment count
    entry.count++;
    return true;
  }

  /**
   * Reset rate limit for a specific key
   */
  static reset(key: string): void {
    rateLimitStore.delete(key);
  }

  /**
   * Clean up expired entries
   */
  private static cleanup(): void {
    const now = Date.now();
    Array.from(rateLimitStore.entries()).forEach(([key, entry]) => {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    });
  }

  /**
   * Check authentication rate limits
   */
  static checkAuthLimit(action: 'signIn' | 'signUp' | 'passwordReset', identifier: string): boolean {
    const key = `auth:${action}:${identifier}`;
    const config = RATE_LIMITS.auth[action];
    return this.checkLimit(key, config);
  }

  /**
   * Check game operation rate limits
   */
  static checkGameLimit(action: 'create' | 'scoreSubmit', userId: string): boolean {
    const key = `games:${action}:${userId}`;
    const config = RATE_LIMITS.games[action];
    return this.checkLimit(key, config);
  }

  /**
   * Get remaining attempts for a specific action
   */
  static getRemainingAttempts(
    key: string,
    limitConfig: { windowMs: number; max: number }
  ): { remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      return {
        remaining: limitConfig.max,
        resetTime: now + limitConfig.windowMs,
      };
    }

    return {
      remaining: Math.max(0, limitConfig.max - entry.count),
      resetTime: entry.resetTime,
    };
  }
}

// Export a hook for React components
export function useRateLimit() {
  return {
    checkAuthLimit: RateLimiter.checkAuthLimit,
    checkGameLimit: RateLimiter.checkGameLimit,
    getRemainingAttempts: RateLimiter.getRemainingAttempts,
    reset: RateLimiter.reset,
  };
} 