'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AuthService } from '@/features/account/services/auth-service';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { fadeIn } from '@/shared/styles/animations';
import { RateLimiter } from '@/lib/security/rate-limiter';
import { RATE_LIMITS } from '@/lib/security/config';
import { GoogleSignInButton } from '@/shared/components/GoogleSignInButton';
import { AppleSignInButton } from '@/shared/components/AppleSignInButton';

export default function SignInPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      await AuthService.signInWithGoogle();
      // Always redirect to dashboard, UsernameEnforcer will handle the modal if needed
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof Error && err.message !== 'Sign in cancelled') {
        setError(err.message);
      }
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    setAppleLoading(true);

    try {
      await AuthService.signInWithApple();
      // Always redirect to dashboard, UsernameEnforcer will handle the modal if needed
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof Error && err.message !== 'Sign in cancelled') {
        setError(err.message);
      }
      setAppleLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRateLimitError(null);

    // Check rate limit
    if (!RateLimiter.checkAuthLimit('signIn', email)) {
      const { remaining, resetTime } = RateLimiter.getRemainingAttempts(
        `auth:signIn:${email}`,
        RATE_LIMITS.auth.signIn
      );
      const minutesUntilReset = Math.ceil((resetTime - Date.now()) / 60000);
      setRateLimitError(
        `Too many login attempts. Please try again in ${minutesUntilReset} minute${
          minutesUntilReset === 1 ? '' : 's'
        }.`
      );
      setLoading(false);
      return;
    }

    try {
      await AuthService.signIn({ email, password });
      
      // Check for redirect parameter
      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get('redirect') || '/dashboard';
      
      router.push(redirect);
    } catch (err) {
      setError(t.auth.signInError);
      console.error('Sign in error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col py-8 px-4 sm:py-16 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">
            {t.auth.signIn}
          </span>
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t.common.or}{' '}
          <Link href="/auth/sign-up" className="font-medium text-primary-600 hover:text-primary-500">
            {t.auth.createAccount}
          </Link>
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-white py-6 px-4 shadow sm:rounded-lg sm:px-10 sm:py-8"
        >
          {/* Error display */}
          {(error || rateLimitError) && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {rateLimitError || error}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* Social login buttons - outside form */}
          <div className="space-y-3">
            {/* Google Sign In */}
            <GoogleSignInButton
              onClick={handleGoogleSignIn}
              loading={googleLoading}
              text={t.auth.signInWithGoogle || 'Inloggen met Google'}
            />

            {/* Apple Sign In */}
            <AppleSignInButton
              onClick={handleAppleSignIn}
              loading={appleLoading}
              text={t.auth.signInWithApple || 'Inloggen met Apple'}
            />
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-400 uppercase tracking-wide font-medium">
                {t.common.or || 'Of'}
              </span>
            </div>
          </div>

          {/* Email/password form */}
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t.auth.email}
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t.auth.password}
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  href="/auth/reset-password"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  {t.auth.forgotPassword}
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t.common.loading : t.auth.signIn}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
} 