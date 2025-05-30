'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { AuthService } from '../services/auth-service';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface UsernameSelectionModalProps {
  isOpen: boolean;
  onComplete: () => void;
  userEmail?: string | null;
}

export function UsernameSelectionModal({ isOpen, onComplete, userEmail }: UsernameSelectionModalProps) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Generate suggested username from email
  useEffect(() => {
    if (userEmail && !username) {
      const suggested = userEmail.split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 20);
      setUsername(suggested);
    }
  }, [userEmail, username]);

  const validateUsername = (name: string): string | null => {
    if (name.length === 0) return null;

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

    const letterCount = (name.match(/[a-z]/g) || []).length;
    if (letterCount < 2) {
      return t.auth.displayNameError.letters;
    }

    return null;
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setUsername(value);
    setValidationError(validateUsername(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateUsername(username);
    if (validation) {
      setValidationError(validation);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if username is unique
      const isUnique = await AuthService.isDisplayNameUnique(username);
      if (!isUnique) {
        setError('Deze gebruikersnaam is al in gebruik. Kies een andere naam.');
        setLoading(false);
        return;
      }

      // Update user profile
      const user = auth.currentUser;
      if (!user) throw new Error('Geen gebruiker ingelogd');

      await updateProfile(user, { displayName: username });
      
      // Update Firestore document
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: username,
        needsUsername: false,
        updatedAt: new Date()
      });

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Kies je gebruikersnaam
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Kies een unieke gebruikersnaam voor je Sjoelify profiel
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-md bg-red-50 p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Gebruikersnaam
                  </label>
                  <div className="mt-1">
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={handleUsernameChange}
                      className={`appearance-none block w-full px-3 py-2 border ${
                        validationError ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                      placeholder="bijv. speler-123"
                      autoFocus
                    />
                    {validationError && (
                      <p className="mt-2 text-sm text-red-600">{validationError}</p>
                    )}
                    <p className="mt-2 text-sm text-gray-500">
                      {t.auth.displayNameHelp}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading || !!validationError || username.length < 3}
                    className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Bezig...' : 'Doorgaan'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 