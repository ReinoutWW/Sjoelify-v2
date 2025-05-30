'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { fadeIn, staggerChildren } from '@/shared/styles/animations';
import { TrophyIcon, ArrowRightIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { GamesList } from '@/features/games/components/GamesList';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-screen py-12"
      >
        <div className="animate-pulse flex space-x-4">
          <div className="h-12 w-12 rounded-full bg-primary-200"></div>
          <div className="space-y-3">
            <div className="h-4 w-[200px] rounded bg-primary-200"></div>
            <div className="h-4 w-[150px] rounded bg-primary-200"></div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!user) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex items-center justify-center min-h-screen py-12"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">{t.dashboard.pleaseSignIn}</h2>
          <p className="mt-2 text-gray-600">{t.dashboard.signInRequired}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={fadeIn} className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">
                {t.dashboard.title}
              </span>
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              {t.dashboard.subtitle}
            </p>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-center gap-4">
            <Link
              href="/games/new"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              {t.dashboard.startNewGame}
              <ArrowRightIcon className="ml-2 -mr-1 h-5 w-5" />
            </Link>
            <Link
              href={`/players/${user.uid}`}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              {t.navigation.yourStats}
              <ChartBarIcon className="ml-2 -mr-1 h-5 w-5" />
            </Link>
            <Link
              href="/leaderboard"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              {t.dashboard.viewLeaderboard}
              <TrophyIcon className="ml-2 -mr-1 h-5 w-5" />
            </Link>
          </motion.div>

          {/* Recent Games */}
          <motion.div variants={fadeIn}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.games.title}</h2>
            <GamesList />
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
} 