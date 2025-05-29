// Security configuration and utilities

// Rate limiting configuration
export const RATE_LIMITS = {
  // Authentication endpoints
  auth: {
    signIn: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      message: 'Too many login attempts, please try again later'
    },
    signUp: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 accounts per hour per IP
      message: 'Too many accounts created from this IP, please try again later'
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 reset attempts per hour
      message: 'Too many password reset attempts, please try again later'
    }
  },
  // Game operations
  games: {
    create: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // 10 games per hour per user
      message: 'Too many games created, please try again later'
    },
    scoreSubmit: {
      windowMs: 60 * 1000, // 1 minute
      max: 30, // 30 score submissions per minute
      message: 'Too many score submissions, please slow down'
    }
  }
};

// Input validation patterns
export const VALIDATION_PATTERNS = {
  // Game title: alphanumeric, spaces, hyphens, 3-50 chars
  gameTitle: /^[a-zA-Z0-9\s-]{3,50}$/,
  
  // Display name: lowercase alphanumeric, hyphens, 3-20 chars
  displayName: /^[a-z0-9-]{3,20}$/,
  
  // Email validation
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Safe string pattern (no special chars that could be used for injection)
  safeString: /^[a-zA-Z0-9\s\-_.,!?'"]+$/
};

// Sanitization utilities
export function sanitizeInput(input: string, maxLength: number = 255): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove potential HTML tags
}

// Check if a string contains potentially dangerous patterns
export function containsDangerousPatterns(input: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /expression\(/i,
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(input));
}

// Generate a secure random token
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const values = new Uint8Array(length);
  
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      token += chars[values[i] % chars.length];
    }
  } else {
    // Fallback for server-side
    for (let i = 0; i < length; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return token;
}

// Session configuration
export const SESSION_CONFIG = {
  // Session timeout in milliseconds (24 hours)
  timeout: 24 * 60 * 60 * 1000,
  
  // Refresh threshold (refresh token if less than 1 hour remaining)
  refreshThreshold: 60 * 60 * 1000,
  
  // Cookie options
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  }
};

// Allowed origins for CORS
export const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  // Add production domains here
];

// Content Security Policy configuration
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-eval'", // Required for Next.js in dev
    "'unsafe-inline'", // Required for Next.js
    'https://*.firebaseapp.com',
    'https://*.googleapis.com'
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled components
    'https://fonts.googleapis.com'
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com'
  ],
  'img-src': [
    "'self'",
    'data:',
    'https:'
  ],
  'connect-src': [
    "'self'",
    'https://*.firebaseio.com',
    'https://*.googleapis.com',
    'https://*.firebase.com',
    'wss://*.firebaseio.com'
  ],
  'frame-ancestors': ["'none'"],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
};

// Format CSP for header
export function formatCSP(config: typeof CSP_CONFIG): string {
  return Object.entries(config)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
} 