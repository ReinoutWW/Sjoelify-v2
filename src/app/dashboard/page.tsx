'use client';

import { motion } from 'framer-motion';
import { GamesList } from '@/features/games/components/GamesList';
import { fadeIn } from '@/shared/styles/animations';
import { useAuth } from '@/lib/context/auth-context';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRightIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { user, loading } = useAuth();

  if (!loading && !user) {
    redirect('/auth/sign-in');
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-4xl sm:text-5xl py-4 font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
            Welcome back!
          </h1>
          <p className="mt-3 sm:mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Track your Sjoelen games, compete with friends, and improve your skills with our modern scoring system.
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto"
            >
              <Link
                href="/games/new"
                className="flex items-center justify-center w-full sm:w-auto px-5 py-2.5 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
              >
                Start New Game
                <ArrowRightIcon className="ml-2 -mr-1 h-5 w-5" />
              </Link>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto"
            >
              <Link
                href="/statistics"
                className="flex items-center justify-center w-full sm:w-auto px-5 py-2.5 border border-gray-300 shadow-sm text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
              >
                View Statistics
                <ChartBarIcon className="ml-2 -mr-1 h-5 w-5 text-gray-400" />
              </Link>
            </motion.div>
          </div>
        </motion.div>

        <div className="mt-8 sm:mt-12">
          <GamesList />
        </div>
      </div>
    </main>
  );
} 