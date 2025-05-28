'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AuthService } from '@/features/account/services/auth-service';
import { fadeIn } from '@/shared/styles/animations';
import { useAuth } from '@/lib/context/auth-context';
import { User } from 'firebase/auth';

export default function SignUpPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);

  const validateDisplayName = (name: string): string | null => {
    if (name.length === 0) return null; // Don't show error for empty field

    if (name.length < 3 || name.length > 20) {
      return 'Display name must be between 3 and 20 characters';
    }

    if (name !== name.toLowerCase()) {
      return 'Display name must be lowercase';
    }

    const validPattern = /^[a-z0-9-]+$/;
    if (!validPattern.test(name)) {
      return 'Only lowercase letters, numbers, and hyphens are allowed';
    }

    // Must contain at least 2 letters
    const letterCount = (name.match(/[a-z]/g) || []).length;
    if (letterCount < 2) {
      return 'Display name must contain at least 2 letters';
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
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account. Please try again.');
      console.error('Sign up error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Redirect if user is already signed in
  if (user) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col py-16 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link href="/auth/sign-in" className="font-medium text-primary-600 hover:text-primary-500">
            sign in to your account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10"
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

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                Display name
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
                  placeholder="e.g. player-123"
                />
                {displayNameError && (
                  <p className="mt-2 text-sm text-red-600">{displayNameError}</p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  Use only lowercase letters, numbers, and hyphens. Must be 3-20 characters long and contain at least 2 letters.
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
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
                Password
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
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
} 