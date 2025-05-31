'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { useDateFormatter } from '@/lib/hooks/useDateFormatter';
import { LeaderboardService, LeaderboardEntry } from '@/features/leaderboard/services/leaderboard-service';
import { TrophyIcon, ChartBarIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { VerifiedBadge } from '@/shared/components/VerifiedBadge';

const LoadingCard = () => (
  <div className="bg-white rounded-2xl border border-gray-200/50 p-4 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="h-10 w-10 bg-gray-200 rounded-xl flex-shrink-0"></div>
      <div className="flex-1 min-w-0">
        <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-48"></div>
      </div>
      <div className="flex-shrink-0">
        <div className="h-7 w-12 bg-gray-200 rounded mb-1"></div>
        <div className="h-2 w-12 bg-gray-200 rounded"></div>
      </div>
    </div>
    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
      <div className="h-3 bg-gray-200 rounded w-20"></div>
      <div className="h-3 bg-gray-200 rounded w-20"></div>
    </div>
  </div>
);

const LeaderboardCard = ({ entry, rank }: { entry: LeaderboardEntry; rank: number }) => {
  const { t } = useTranslation();
  const { formatDate } = useDateFormatter();
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 0:
        return { color: 'text-amber-500', bg: 'bg-amber-50' };
      case 1:
        return { color: 'text-gray-500', bg: 'bg-gray-50' };
      case 2:
        return { color: 'text-orange-500', bg: 'bg-orange-50' };
      default:
        return null;
    }
  };

  const rankIcon = getRankIcon(rank);
  const isTopThree = rank < 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: rank * 0.05 }}
      className="bg-white rounded-2xl border border-gray-200/50 overflow-hidden"
    >
      <Link href={`/players/${entry.playerId}`} className="block">
        {/* Mobile Layout */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Rank Badge */}
            <div className="flex-shrink-0">
              {isTopThree && rankIcon ? (
                <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl ${rankIcon.bg} flex items-center justify-center`}>
                  <TrophyIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${rankIcon.color}`} />
                </div>
              ) : (
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gray-50 flex items-center justify-center">
                  <span className="text-sm sm:text-base font-semibold text-gray-600">#{rank + 1}</span>
                </div>
              )}
            </div>

            {/* Player Info - Better mobile layout */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <h3 className="font-semibold text-gray-900 truncate text-base sm:text-lg">{entry.displayName}</h3>
                    {entry.verified && <VerifiedBadge size="xs" />}
                  </div>
                  
                  {/* Mobile: Stack info vertically */}
                  <div className="space-y-1 sm:space-y-0 sm:flex sm:items-center sm:gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <ChartBarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{entry.gamesPlayed} {entry.gamesPlayed === 1 ? t.profile.game : t.profile.games}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{t.friends.lastPlayed} {formatDate(entry.lastPlayed)}</span>
                    </div>
                  </div>
                </div>

                {/* Score Display - Right aligned */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-2xl sm:text-3xl font-bold text-primary-600">{entry.bestAverageInGame}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">{t.games.averageScore}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Score Details Bar - Hidden on mobile, visible on desktop */}
          <div className="hidden sm:flex mt-4 pt-4 border-t border-gray-100 items-center justify-between text-sm">
            <div className="text-gray-500">
              {t.leaderboard.averageScore}: <span className="font-semibold text-gray-700">{entry.averageScore}</span>
            </div>
            <div className="text-gray-500">
              {t.leaderboard.highestScore}: <span className="font-semibold text-gray-700">{entry.bestScore}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default function LeaderboardPage() {
  const { t } = useTranslation();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        console.log('Fetching leaderboard data...');
        const data = showVerifiedOnly 
          ? await LeaderboardService.getLeaderboard()
          : await LeaderboardService.getAllPlayers();
        console.log('Raw leaderboard data:', data);
        
        if (!data || data.length === 0) {
          console.log('No leaderboard data returned');
          setLeaderboard([]);
          return;
        }

        const formattedData = data.map(entry => {
          console.log('Processing entry:', entry);
          return {
            ...entry,
            displayName: entry.displayName ? entry.displayName.split('@')[0].replace(/["']/g, '') : 'Unknown Player',
            lastPlayed: entry.lastPlayed ? new Date(entry.lastPlayed) : new Date()
          };
        });
        console.log('Formatted leaderboard data:', formattedData);
        setLeaderboard(formattedData);
      } catch (err) {
        console.error('Error loading leaderboard:', err);
        setError(t.statistics.failedToLoad);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [t.statistics.failedToLoad, showVerifiedOnly]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header on Mobile */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200/50 lg:relative lg:bg-transparent lg:border-0 lg:backdrop-blur-none">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">
                {t.leaderboard.title}
              </span>
            </h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">{t.leaderboard.subtitle}</p>
            
            {/* Toggle for verified/all players */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showVerifiedOnly}
                  onChange={(e) => setShowVerifiedOnly(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                <span className="ml-2 text-xs font-medium text-gray-700 flex items-center gap-1">
                  {showVerifiedOnly && <VerifiedBadge size="xs" showTooltip={false} />}
                  {showVerifiedOnly ? 'Verified Only' : 'All Players'}
                </span>
              </label>
            </div>
            
            <div className="mt-2 text-xs sm:text-sm text-gray-500 flex items-center justify-center gap-1">
              {showVerifiedOnly && (
                <>
                  <VerifiedBadge size="xs" showTooltip={false} />
                  {t.leaderboard.onlyVerifiedPlayersShown}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4">
          {loading && (
            <>
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
            </>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && leaderboard.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <p className="text-base sm:text-lg text-gray-600">{t.leaderboard.noData}</p>
            </div>
          )}

          {!loading && !error && leaderboard.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              {leaderboard.map((entry, index) => (
                <LeaderboardCard key={entry.playerId} entry={entry} rank={index} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 