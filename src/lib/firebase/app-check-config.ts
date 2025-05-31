// App Check configuration
export function getAppCheckConfig() {
  // Check for environment variable first
  if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
    return process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  }

  // In production, use hardcoded value if env var not available
  if (process.env.NODE_ENV === 'production') {
    return "6Le_TlErAAAAAEB8RPmNdh1YKxw7RZuX5y98xC5o";
  }

  return null;
} 