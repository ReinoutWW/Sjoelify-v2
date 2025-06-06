'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/context/auth-context';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { AuthService } from '@/features/account/services/auth-service';
import { fadeIn } from '@/shared/styles/animations';
import { SjoelifyLogo } from './SjoelifyLogo';
import { CompactLanguageSwitcher } from '@/components/CompactLanguageSwitcher';
import { 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon,
  HomeIcon,
  TrophyIcon,
  ChartBarIcon,
  UserGroupIcon,
  CogIcon
} from '@heroicons/react/24/outline';

export function Navigation() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Debug user object
  useEffect(() => {
    if (user) {
      console.log('User object:', user);
      console.log('User email:', user.email);
    }
  }, [user]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      setIsProfileOpen(false);
      await AuthService.signOut();
      window.location.href = '/';
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <motion.nav
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="bg-white shadow-sm sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10">
        <div className="flex justify-between items-center h-16 sm:h-20 py-4">
          <div className="flex items-center">
            <SjoelifyLogo 
              size="small" 
              className="block" // Always show small logo
            />
            {user && (
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                <Link
                  href="/games/new"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                >
                  {t.navigation.newGame}
                </Link>
                <Link
                  href="/leaderboard"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                >
                  {t.navigation.leaderboard}
                </Link>
                <Link
                  href="/friends"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                >
                  {t.navigation.friends}
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center" ref={profileRef}>
            {!loading && (
              <>
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="group flex items-center gap-2"
                      aria-label="Account menu"
                    >
                      <span className="block text-sm font-medium text-gray-700">
                        {user?.displayName}
                      </span>
                      <div className="relative w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden ring-2 ring-white transition-all group-hover:ring-primary-100 group-hover:scale-105">
                        {user?.photoURL ? (
                          <Image
                            src={user.photoURL}
                            alt="Profile"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <UserCircleIcon className="w-7 h-7 text-primary-600" />
                        )}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isProfileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 py-1"
                        >
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">
                              {user?.displayName}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {user?.email}
                            </p>
                          </div>

                          <div className="py-1">
                            <Link
                              href="/dashboard"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <HomeIcon className="h-5 w-5 mr-2" />
                              {t.navigation.dashboard}
                            </Link>
                            <Link
                              href={`/players/${user?.uid}`}
                              onClick={() => setIsProfileOpen(false)}
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <ChartBarIcon className="h-5 w-5 mr-2" />
                              {t.navigation.yourStats}
                            </Link>
                            <Link
                              href="/friends"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <UserGroupIcon className="h-5 w-5 mr-2" />
                              {t.navigation.friends}
                            </Link>
                            <Link
                              href="/leaderboard"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <TrophyIcon className="h-5 w-5 mr-2" />
                              {t.navigation.leaderboard}
                            </Link>
                            <Link
                              href="/settings"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <CogIcon className="h-5 w-5 mr-2" />
                              {t.navigation.settings}
                            </Link>
                          </div>

                          <div className="border-t border-gray-100">
                            <button
                              onClick={handleSignOut}
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                              {t.auth.signOut}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Link
                      href="/auth/sign-in"
                      className="inline-flex items-center px-2.5 sm:px-4 py-1.5 sm:py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                    >
                      {t.auth.signIn}
                    </Link>
                    <Link
                      href="/auth/sign-up"
                      className="inline-flex items-center px-2.5 sm:px-4 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                    >
                      {t.auth.signUp}
                    </Link>
                    <div className="ml-1 sm:ml-2">
                      <CompactLanguageSwitcher />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
} 