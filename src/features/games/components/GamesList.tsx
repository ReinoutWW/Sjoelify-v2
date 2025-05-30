'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/context/auth-context';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { useDateFormatter } from '@/lib/hooks/useDateFormatter';
import { GameService } from '../services/game-service';
import { Game } from '../types';
import { fadeIn, staggerChildren, slideIn } from '@/shared/styles/animations';
import { UserCircleIcon, CalendarIcon, UsersIcon, TrophyIcon, ChartBarIcon } from '@heroicons/react/24/outline';
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

interface GameListSectionProps {
  title: string;
  games: Game[];
  emptyMessage: string;
}

const LoadingCard = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 animate-pulse">
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="h-10 w-10 bg-gray-200 rounded-lg flex-shrink-0"></div>
      <div className="flex-1 w-full">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="h-8 w-24 bg-gray-200 rounded-lg mt-2 sm:mt-0"></div>
    </div>
  </div>
);

function GameListSection({ title, games, emptyMessage }: GameListSectionProps) {
  const { t } = useTranslation();
  const { formatDate } = useDateFormatter();
  
  if (games.length === 0) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="text-center py-6 sm:py-8 bg-white rounded-xl shadow-sm border border-gray-100"
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
      className="space-y-3 sm:space-y-4"
    >
      {title && (
        <motion.h2
          variants={fadeIn}
          className="text-lg sm:text-xl font-semibold text-gray-900"
        >
          {title}
        </motion.h2>
      )}

      <motion.div
        variants={fadeIn}
        className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200"
      >
        <ul className="divide-y divide-gray-100">
          {games.map((game, index) => {
            // Calculate total score for each player
            const playerScores = game.players.map(player => ({
              ...player,
              totalScore: game.scores?.[player.id]?.total || 0
            }));
            
            // Sort players by score in descending order
            const sortedPlayers = [...playerScores].sort((a, b) => b.totalScore - a.totalScore);
            const leader = sortedPlayers[0];
            const isClose = sortedPlayers.length > 1 && 
              (leader.totalScore - sortedPlayers[1].totalScore) < 20;

            return (
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
                  <div className="px-4 sm:px-6 py-4 sm:py-5">
                    {/* Mobile-optimized layout */}
                    <div className="flex flex-col gap-3 sm:hidden">
                      {/* Header row with icon, title and status */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center flex-shrink-0">
                          {game.isClosed ? (
                            <TrophyIcon className="h-5 w-5 text-primary-600" />
                          ) : (
                            <ChartBarIcon className="h-5 w-5 text-primary-600" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-base font-medium text-gray-900 truncate flex-1">
                              {game.title}
                            </h3>
                            {!game.isClosed && (
                              <span className="relative flex h-3 w-3 flex-shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-400"></span>
                              </span>
                            )}
                          </div>
                          
                          {/* Meta information */}
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <UsersIcon className="h-4 w-4 text-gray-400" />
                              <span>{game.players.length} {t.games.players.toLowerCase()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4 text-gray-400" />
                              <time dateTime={toISOStringOrUndefined(game.updatedAt)}>
                                {formatDate(game.updatedAt) || t.games.unknownDate}
                              </time>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status and result row */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                          game.isClosed 
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-primary-50 text-primary-700'
                        }`}>
                          {game.isClosed ? t.games.completed : `${t.games.round} ${game.currentRound}/5`}
                        </span>

                        {/* Winner/Leader info */}
                        {leader && (
                          <div className="flex items-center gap-1.5 text-sm">
                            {game.isClosed ? (
                              <>
                                <TrophyIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                <span className="text-gray-600 truncate max-w-[120px]">{leader.displayName}</span>
                                <span className="font-semibold text-amber-600">{leader.totalScore}</span>
                              </>
                            ) : (
                              <>
                                <span className="text-gray-500">{t.games.leading}:</span>
                                <span className="font-medium text-gray-700 truncate max-w-[100px]">{leader.displayName}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Player avatars - only show if 3 or fewer players */}
                      {game.players.length <= 3 && (
                        <div className="flex -space-x-2 overflow-hidden">
                          {game.players.map((player) => (
                            <div
                              key={player.id}
                              className="inline-block h-6 w-6 rounded-full ring-2 ring-white"
                            >
                              <UserCircleIcon className="h-full w-full text-gray-300" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Desktop layout - hidden on mobile */}
                    <div className="hidden sm:flex sm:flex-col sm:gap-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center flex-shrink-0">
                            {game.isClosed ? (
                              <TrophyIcon className="h-5 w-5 text-primary-600" />
                            ) : (
                              <ChartBarIcon className="h-5 w-5 text-primary-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-medium text-gray-900 truncate pr-4">
                              {game.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <UsersIcon className="h-4 w-4 text-gray-400" />
                                <span>{game.players.length} {t.games.players.toLowerCase()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4 text-gray-400" />
                                <time dateTime={toISOStringOrUndefined(game.updatedAt)}>
                                  {formatDate(game.updatedAt) || t.games.unknownDate}
                                </time>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                            game.isClosed 
                              ? 'bg-gray-100/75 text-gray-600'
                              : 'bg-primary-50 text-primary-700'
                          }`}>
                            {game.isClosed ? t.games.completed : `${t.games.round} ${game.currentRound}/5`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-2 overflow-hidden">
                          {game.players.map((player) => (
                            <div
                              key={player.id}
                              className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                            >
                              <UserCircleIcon className="h-full w-full text-gray-300" />
                            </div>
                          ))}
                        </div>

                        {game.isClosed && leader && (
                          <div className="flex items-center gap-2 overflow-hidden flex-1">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-sm">
                              <TrophyIcon className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{leader.displayName}</span>
                              <span className="font-semibold">{leader.totalScore}</span>
                            </div>
                            {isClose && (
                              <span className="text-xs text-gray-500 italic whitespace-nowrap">{t.games.closeGame}</span>
                            )}
                          </div>
                        )}
                        
                        {!game.isClosed && leader && (
                          <div className="flex items-center gap-2 overflow-hidden flex-1">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary-50 text-primary-700 text-sm">
                              <ChartBarIcon className="h-4 w-4 flex-shrink-0" />
                              <span>{t.games.leading}:</span>
                              <span className="font-medium truncate">{leader.displayName}</span>
                              <span className="font-semibold">{leader.totalScore}</span>
                            </div>
                            {isClose && (
                              <span className="text-xs text-gray-500 italic whitespace-nowrap">{t.games.neckAndNeck}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </motion.div>
    </motion.div>
  );
}

export function GamesList() {
  const { user } = useAuth();
  const { t } = useTranslation();
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
        setFilteredFinishedGames(finished);
      } catch (err) {
        setError(t.games.failedToLoadGames);
        console.error('Error loading games:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [user?.uid, t.games.failedToLoadGames]);

  const handleFinishedGamesFilters = useCallback((filteredGames: Game[]) => {
    setFilteredFinishedGames(filteredGames);
  }, []);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
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
        className="text-center py-8 sm:py-12"
      >
        <h3 className="text-lg font-medium text-gray-900">{t.games.noGamesYet}</h3>
        <p className="mt-2 text-sm text-gray-500">
          {t.games.getStartedMessage}
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
            {t.games.createNewGame}
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
      className="space-y-6 sm:space-y-8"
    >
      <div className="flex justify-end">
        <motion.div
          variants={fadeIn}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full sm:w-auto"
        >
          <Link
            href="/games/new"
            className="inline-flex w-full sm:w-auto items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200 shadow-sm"
          >
            {t.games.newGame}
          </Link>
        </motion.div>
      </div>

      {activeGames.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{t.games.activeGames}</h2>
          <GameListSection
            title=""
            games={activeGames}
            emptyMessage={t.games.noActiveGamesMessage}
          />
        </div>
      )}

      {finishedGames.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{t.games.finishedGames}</h2>
          <GameFilters
            games={finishedGames}
            onFiltersChange={handleFinishedGamesFilters}
          />
          <GameListSection
            title=""
            games={filteredFinishedGames}
            emptyMessage={t.games.noFinishedGamesMessage}
          />
        </div>
      )}
    </motion.div>
  );
} 