'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/context/auth-context';
import { GameService } from '../services/game-service';
import { Game } from '../types';
import { fadeIn, staggerChildren, slideIn } from '@/shared/styles/animations';
import { UserCircleIcon, CalendarIcon, UsersIcon } from '@heroicons/react/24/outline';
import { GameFilters } from './GameFilters';

// Add helper functions for safe date handling
const toISOStringOrUndefined = (dateString: string | number | Date | undefined | null): string | undefined => {
  if (!dateString) return undefined;
  
  try {
    // Handle Firestore Timestamp
    if (typeof dateString === 'object' && dateString !== null && 'seconds' in dateString && typeof dateString.seconds === 'number') {
      const date = new Date(dateString.seconds * 1000);
      return isNaN(date.getTime()) ? undefined : date.toISOString();
    }
    
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date.toISOString();
  } catch (error) {
    console.error('Error converting date to ISO string:', error);
    return undefined;
  }
};

const formatDate = (dateString: string | number | Date | undefined | null) => {
  if (!dateString) return 'Unknown date';
  
  try {
    // Handle Firestore Timestamp
    if (typeof dateString === 'object' && dateString !== null && 'seconds' in dateString && typeof dateString.seconds === 'number') {
      const date = new Date(dateString.seconds * 1000);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

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
      {title && (
        <motion.h2
          variants={fadeIn}
          className="text-xl font-semibold text-gray-900"
        >
          {title}
        </motion.h2>
      )}

      <motion.div
        variants={fadeIn}
        className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200"
      >
        <ul className="divide-y divide-gray-100">
          {games.map((game, index) => (
            <motion.li
              key={game.id}
              variants={slideIn}
              custom={index}
              whileHover={{ scale: 1.01 }}
              className="transition-all duration-200 hover:bg-gray-50 relative"
            >
              {!game.isClosed && (
                <div className="absolute top-4 right-4 flex items-center justify-center">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-400"></span>
                  </span>
                </div>
              )}
              <Link 
                href={`/games/${game.id}`}
                className="block cursor-pointer"
              >
                <div className="px-6 py-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-medium text-gray-900 truncate pr-4">
                        {game.title}
                      </h3>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        game.isClosed 
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-primary-50 text-primary-700'
                      }`}>
                        {game.isClosed ? 'Completed' : `Round ${game.currentRound}/5`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <UsersIcon className="h-4 w-4 text-gray-400" />
                      <span>{game.players.length} players</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <time dateTime={toISOStringOrUndefined(game.updatedAt)}>
                        {formatDate(game.updatedAt)}
                      </time>
                    </div>
                  </div>

                  <div className="mt-3 flex -space-x-2 overflow-hidden">
                    {game.players.map((player) => (
                      <div
                        key={player.id}
                        className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                      >
                        <UserCircleIcon className="h-full w-full text-gray-300" />
                      </div>
                    ))}
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
  const [filteredFinishedGames, setFilteredFinishedGames] = useState<Game[]>([]);
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
        // Initialize filtered games only once when data is loaded
        setFilteredFinishedGames(finished);
      } catch (err) {
        setError('Failed to load games');
        console.error('Error loading games:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [user?.uid]);

  // Memoize the filter handler to prevent unnecessary re-renders
  const handleFinishedGamesFilters = useCallback((filteredGames: Game[]) => {
    setFilteredFinishedGames(filteredGames);
  }, []);

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

      {activeGames.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Active Games</h2>
          <GameListSection
            title=""
            games={activeGames}
            emptyMessage="No active games match your filters"
          />
        </div>
      )}

      {finishedGames.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Finished Games</h2>
          <GameFilters
            games={finishedGames}
            onFiltersChange={handleFinishedGamesFilters}
          />
          <GameListSection
            title=""
            games={filteredFinishedGames}
            emptyMessage="No finished games match your filters"
          />
        </div>
      )}
    </motion.div>
  );
} 