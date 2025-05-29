'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { LeaderboardService, LeaderboardEntry } from '@/features/leaderboard/services/leaderboard-service';
import { TrophyIcon, ChartBarIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { VerifiedBadge } from '@/shared/components/VerifiedBadge';

const LoadingCard = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 animate-pulse">
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="h-12 w-12 bg-gray-200 rounded-xl flex-shrink-0"></div>
      <div className="flex-1 w-full sm:w-auto">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="h-12 w-24 bg-gray-200 rounded-lg mt-2 sm:mt-0"></div>
    </div>
  </div>
);

const LeaderboardCard = ({ entry, rank }: { entry: LeaderboardEntry; rank: number }) => {
  const getRankStyles = (rank: number) => {
    switch (rank) {
      case 0:
        return {
          bg: 'bg-gradient-to-br from-amber-50 to-amber-100',
          icon: 'text-amber-600'
        };
      case 1:
        return {
          bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
          icon: 'text-gray-600'
        };
      case 2:
        return {
          bg: 'bg-gradient-to-br from-orange-50 to-orange-100',
          icon: 'text-orange-600'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
          icon: 'text-gray-600'
        };
    }
  };

  const styles = getRankStyles(rank);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:border-primary-200 transition-colors">
      <div className="px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Rank Icon/Number */}
          <div className="flex-shrink-0">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${styles.bg}`}>
              {rank < 3 ? (
                <TrophyIcon className={`h-6 w-6 ${styles.icon}`} />
              ) : (
                <span className="text-lg font-bold text-gray-600">#{rank + 1}</span>
              )}
            </div>
          </div>

          {/* Player Info */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <Link
                  href={`/players/${entry.playerId}`}
                  className="hover:text-primary-600 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900 truncate">
                      {entry.displayName}
                    </h2>
                    <VerifiedBadge size="sm" />
                  </div>
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <ChartBarIcon className="h-4 w-4" />
                    <span>{entry.gamesPlayed} games</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="whitespace-nowrap">Last played {entry.lastPlayed.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Best Score */}
              <Link
                href={`/games/${entry.bestGameId}`}
                className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1 px-4 py-2 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
              >
                <span className="text-2xl font-bold">{entry.bestAverageInGame}</span>
                <span className="text-xs whitespace-nowrap">Best Average</span>
              </Link>
            </div>

            {/* Additional Stats */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <span>Average:</span>
                <span className="font-medium">{entry.averageScore}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Best Score:</span>
                <span className="font-medium">{entry.bestScore}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        console.log('Fetching leaderboard data...');
        const data = await LeaderboardService.getLeaderboard();
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
        setError('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Leaderboard</h1>
          <p className="mt-2 text-base sm:text-lg text-gray-600">Top Sjoelen players ranked by best game average</p>
          <p className="mt-1 text-sm text-gray-500 flex items-center justify-center gap-1">
            <VerifiedBadge size="xs" showTooltip={false} />
            Only verified players are shown
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
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
              <p className="text-base sm:text-lg text-gray-600">No games have been played yet.</p>
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