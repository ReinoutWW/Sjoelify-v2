import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public paths that don't require authentication
const publicPaths = [
  '/auth/sign-in',
  '/auth/sign-up',
  '/leaderboard',
  '/',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Different CSP for development vs production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const cspDirectives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-eval'",
      "'unsafe-inline'",
      'https://*.firebaseapp.com',
      'https://*.googleapis.com',
      'https://apis.google.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
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
      // Production Firebase domains
      'https://*.firebaseio.com',
      'https://*.googleapis.com',
      'https://*.firebase.com',
      'wss://*.firebaseio.com',
      // Google Analytics domains
      'https://www.google-analytics.com',
      'https://analytics.google.com',
      'https://www.googletagmanager.com',
      // Add localhost for development
      ...(isDevelopment ? [
        'http://localhost:8081',
        'ws://localhost:8081',
        'http://localhost:9099',
        'ws://localhost:9099',
        'http://localhost:4000',
        'http://127.0.0.1:8081',
        'ws://127.0.0.1:8081',
        'http://127.0.0.1:9099',
        'ws://127.0.0.1:9099',
        'http://127.0.0.1:4000'
      ] : [])
    ],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
  };

  // Format CSP string
  const csp = Object.entries(cspDirectives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');

  // Add security headers to all responses
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Only add HSTS in production
  if (!isDevelopment) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Note: Firebase Auth handles authentication state internally via ID tokens
  // The middleware only needs to set security headers, not check authentication
  // Authentication is handled client-side by Firebase Auth and server-side by Firestore Security Rules

  // Check if the path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Get the token from the cookies (this needs to be properly implemented)
  const token = request.cookies.get('token');

  // If the path is not public and there's no token, redirect to sign in
  if (!isPublicPath && !token) {
    const signInUrl = new URL('/auth/sign-in', request.url);
    return NextResponse.redirect(signInUrl, {
      headers: response.headers
    });
  }

  // If we have a token and we're trying to access auth pages, redirect to home
  if (token && (pathname.startsWith('/auth/sign-in') || pathname.startsWith('/auth/sign-up'))) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl, {
      headers: response.headers
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (they should handle their own security)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}; 