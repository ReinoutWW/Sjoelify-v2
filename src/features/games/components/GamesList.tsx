'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/context/auth-context';
import { GameService } from '../services/game-service';
import { Game } from '../types';
import { fadeIn, staggerChildren, slideIn } from '@/shared/styles/animations';

interface GameListSectionProps {
  title: string;
  games: Game[];
  emptyMessage: string;
}

function GameListSection({ title, games, emptyMessage }: GameListSectionProps) {
  if (games.length === 0) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="text-center py-8 bg-white rounded-xl shadow-sm border border-gray-100"
      >
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
      className="space-y-4"
    >
      <motion.h2
        variants={fadeIn}
        className="text-xl font-semibold text-gray-900"
      >
        {title}
      </motion.h2>

      <motion.div
        variants={fadeIn}
        className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100"
      >
        <ul role="list" className="divide-y divide-gray-100">
          {games.map((game, index) => (
            <motion.li
              key={game.id}
              variants={slideIn}
              custom={index}
              whileHover={{ scale: 1.02, background: 'rgba(243, 244, 246, 0.5)' }}
              className="transition-colors duration-200"
            >
              <Link href={`/games/${game.id}`} className="block">
                <div className="px-6 py-5">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-medium text-primary-600 truncate">
                      {game.title}
                    </p>
                    <div className="ml-2 flex-shrink-0">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        game.isClosed 
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-primary-50 text-primary-700'
                      }`}>
                        {game.isClosed ? 'Completed' : `Round ${game.currentRound}/5`}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <span>{game.players.length} players</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>
                        {new Date(game.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}

export function GamesList() {
  const { user } = useAuth();
  const [activeGames, setActiveGames] = useState<Game[]>([]);
  const [finishedGames, setFinishedGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      if (!user?.uid) return;

      try {
        const [active, finished] = await Promise.all([
          GameService.getActiveGames(user.uid),
          GameService.getFinishedGames(user.uid)
        ]);
        setActiveGames(active);
        setFinishedGames(finished);
      } catch (err) {
        setError('Failed to load games');
        console.error('Error loading games:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [user?.uid]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-12"
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

  if (error) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="rounded-md bg-red-50 p-4"
      >
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
          </div>
        </div>
      </motion.div>
    );
  }

  if (activeGames.length === 0 && finishedGames.length === 0) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="text-center py-12"
      >
        <h3 className="text-lg font-medium text-gray-900">No games yet</h3>
        <p className="mt-2 text-sm text-gray-500">
          Get started by creating a new game
        </p>
        <motion.div
          className="mt-6"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            href="/games/new"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
          >
            Create New Game
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
      className="space-y-8"
    >
      <div className="flex justify-end">
        <motion.div
          variants={fadeIn}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            href="/games/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200 shadow-sm"
          >
            New Game
          </Link>
        </motion.div>
      </div>

      <GameListSection
        title="Active Games"
        games={activeGames}
        emptyMessage="No active games"
      />

      <GameListSection
        title="Finished Games"
        games={finishedGames}
        emptyMessage="No finished games"
      />
    </motion.div>
  );
} 