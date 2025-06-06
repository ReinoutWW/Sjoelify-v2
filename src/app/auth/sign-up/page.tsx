'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AuthService } from '@/features/account/services/auth-service';
import { fadeIn } from '@/shared/styles/animations';
import { useAuth } from '@/lib/context/auth-context';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { User } from 'firebase/auth';
import { GoogleSignInButton } from '@/shared/components/GoogleSignInButton';
import { AppleSignInButton } from '@/shared/components/AppleSignInButton';

export default function SignUpPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);

  const validateDisplayName = (name: string): string | null => {
    if (name.length === 0) return null; // Don't show error for empty field

    if (name.length < 3 || name.length > 20) {
      return t.auth.displayNameError.length;
    }

    if (name !== name.toLowerCase()) {
      return t.auth.displayNameError.lowercase;
    }

    const validPattern = /^[a-z0-9-]+$/;
    if (!validPattern.test(name)) {
      return t.auth.displayNameError.pattern;
    }

    // Must contain at least 2 letters
    const letterCount = (name.match(/[a-z]/g) || []).length;
    if (letterCount < 2) {
      return t.auth.displayNameError.letters;
    }

    return null;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Real-time validation for display name
    if (name === 'displayName') {
      setDisplayNameError(validateDisplayName(value));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Final validation check
    const nameError = validateDisplayName(formData.displayName);
    if (nameError) {
      setDisplayNameError(nameError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await AuthService.signUp(formData);
      // Wait for auth state to update
      await new Promise<void>((resolve) => {
        const unsubscribe = AuthService.onAuthStateChanged((currentUser: User | null) => {
          if (currentUser) {
            unsubscribe();
            resolve();
          }
        });
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.failedToCreateAccount);
      console.error('Sign up error:', err);
    } finally {
      setLoading(false);
    }
  };

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

  // Redirect if user is already signed in
  if (user) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col py-8 px-4 sm:py-16 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">
            {t.auth.createYourAccount}
          </span>
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t.common.or}{' '}
          <Link href="/auth/sign-in" className="font-medium text-primary-600 hover:text-primary-500">
            {t.auth.signInToYourAccount}
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            {/* Google Sign In */}
            <GoogleSignInButton
              onClick={handleGoogleSignIn}
              loading={googleLoading}
              text={t.auth.signUpWithGoogle || 'Registreren met Google'}
            />

            {/* Apple Sign In */}
            <AppleSignInButton
              onClick={handleAppleSignIn}
              loading={appleLoading}
              text={t.auth.signUpWithApple || 'Registreren met Apple'}
            />

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-400 uppercase tracking-wide font-medium">
                  {t.common.or || 'Of'}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                {t.auth.displayName}
              </label>
              <div className="mt-1">
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.displayName}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    displayNameError ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900`}
                  placeholder={t.auth.displayNamePlaceholder}
                />
                {displayNameError && (
                  <p className="mt-2 text-sm text-red-600">{displayNameError}</p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  {t.auth.displayNameHelp}
                </p>
              </div>
            </div>

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
                  value={formData.email}
                  onChange={handleChange}
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
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !!displayNameError}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t.auth.creatingAccount : t.auth.createAccount}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
} 