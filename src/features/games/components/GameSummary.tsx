'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Game } from '../types';
import { fadeIn, staggerChildren } from '@/shared/styles/animations';
import { UserCircleIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { formatDate, isFirestoreTimestamp } from '@/shared/utils/date-utils';
import Link from 'next/link';
import { LeaderboardService } from '@/features/leaderboard/services/leaderboard-service';
import { VerifiedBadge } from '@/shared/components/VerifiedBadge';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { UserProfile } from '@/features/account/types';
import { ShareButton } from '@/shared/components/ShareButton';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

interface PlayerStats {
  playerId: string;
  displayName: string;
  rounds: { [key: number]: number };
  totalScore: number;
  averageScore: number;
  bestRound: number;
  worstRound: number;
  relativeScores: { [key: number]: number };
  relativeAverage: number;
  isNewPersonalBest: boolean;
  isNewBestAverage: boolean;
  bestAverageInGame: number;
}

interface GameSummaryProps {
  game: Game;
}

export function GameSummary({ game }: GameSummaryProps) {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    async function fetchAndProcessStats() {
      try {
        // Get all players' data (including non-verified) to show their best averages
        const leaderboardData = await LeaderboardService.getAllPlayers();

        const stats = game.players.map((player) => {
          const playerScores = game.scores[player.id];
          const rounds = playerScores?.rounds || {};
          const roundScores = Object.values(rounds);
          
          // Get player data from leaderboard
          const playerData = leaderboardData.find(p => p.playerId === player.id);
          const playerAverage = roundScores.length > 0 
            ? Math.round(roundScores.reduce((a, b) => a + b, 0) / roundScores.length) 
            : 0;
          
          // Get this player's all-time best average from any single game
          const playerBestAverage = playerData?.bestAverageInGame || 0;
          
          // Calculate relative scores against player's all-time best average
          const relativeScores = Object.entries(rounds).reduce((acc, [round, score]) => ({
            ...acc,
            [round]: score - playerBestAverage
          }), {});
          
          return {
            playerId: player.id,
            displayName: player.displayName,
            rounds,
            totalScore: playerScores?.total || 0,
            averageScore: playerAverage,
            bestRound: roundScores.length > 0 ? Math.max(...roundScores) : 0,
            worstRound: roundScores.length > 0 ? Math.min(...roundScores) : 0,
            relativeScores,
            relativeAverage: playerAverage - playerBestAverage,
            isNewPersonalBest: playerData ? Math.max(...roundScores) > playerData.bestScore : false,
            isNewBestAverage: playerData ? playerAverage > playerBestAverage : false,
            bestAverageInGame: playerBestAverage
          } as PlayerStats;
        }).sort((a, b) => b.totalScore - a.totalScore); // Sort by total score

        setPlayerStats(stats);
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAndProcessStats();
  }, [game]);

  // Find overall statistics
  const gameStats = useMemo(() => {
    if (playerStats.length === 0) return null;

    const allScores = playerStats.flatMap(player => Object.values(player.rounds));
    return {
      highestScore: Math.max(...allScores),
      lowestScore: Math.min(...allScores),
      overallAverage: Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length),
      winner: playerStats[0], // Already sorted by total score
      bestAveragePlayer: [...playerStats].sort((a, b) => b.averageScore - a.averageScore)[0],
      bestSingleRoundPlayer: [...playerStats].sort((a, b) => b.bestRound - a.bestRound)[0],
    };
  }, [playerStats]);

  if (loading || !gameStats) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex items-center justify-center min-h-[200px]"
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

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
      className="space-y-8"
    >
      {/* Game Title */}
      <motion.div
        variants={fadeIn}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM9 7.5A.75.75 0 009 9h1.5c.184 0 .355.097.448.257L12 10.5l1.052-1.243A.5.5 0 0113.5 9H15a.75.75 0 000-1.5H9Zm-1.5 6.44 2.72-2.72a.75.75 0 011.06 0l2.72 2.72a.75.75 0 11-1.06 1.06L12 13.06l-.97.97a.75.75 0 01-1.06 0l-.97-.97-.53.53a.75.75 0 01-1.06-1.06Z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{game.title}</h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-gray-500">
              <span className="whitespace-nowrap">{t.games.gameSummary}</span>
              <span className="hidden sm:inline">•</span>
              <time dateTime={formatDate(game.createdAt)} className="whitespace-nowrap">
                {formatDate(game.createdAt)}
              </time>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <ShareButton 
            title={`${game.title} - ${t.games.gameSummary}`}
            text={`${gameStats?.winner.displayName} ${t.games.wonWith} ${gameStats?.winner.totalScore} ${t.games.pts}!`}
          />
          {!game.isClosed && (
            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-primary-100 text-primary-800 whitespace-nowrap">
              {t.games.round} {game.currentRound}/5
            </span>
          )}
        </div>
      </motion.div>

      {/* Winner Section */}
      <motion.div
        variants={fadeIn}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-50/50 to-yellow-50/50 p-8"
      >
        <div 
          className="absolute inset-0 bg-gradient-to-r from-amber-100/20 to-yellow-100/20"
          style={{
            maskImage: 'radial-gradient(circle at top left, transparent 0%, black 100%)'
          }}
        />
        <div className="relative flex items-center gap-4">
          <div className="flex-shrink-0">
            <UserCircleIcon className="h-14 w-14 text-amber-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-amber-900 truncate">{gameStats.winner.displayName}</h2>
              {(() => {
                const winnerPlayer = game.players.find(p => p.id === gameStats.winner.playerId);
                if (!winnerPlayer) return null;
                if (!('isGuest' in winnerPlayer) && 'verified' in winnerPlayer && (winnerPlayer as UserProfile).verified) {
                  return <VerifiedBadge size="md" />;
                }
                return null;
              })()}
              <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-0.5 text-sm font-medium text-amber-800 border border-amber-200">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1 text-amber-600">
                  <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h15.19c.414 0 .75-.336.75-.75a2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 013.16 5.337a45.6 45.6 0 012.006-.343v.256zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 01-2.863 3.207 6.72 6.72 0 00.857-3.294z" clipRule="evenodd" />
                </svg>
                {t.games.winner}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-amber-600">{t.games.totalScore}: {gameStats.winner.totalScore}</p>
              <p className="text-amber-600">{t.games.bestRound}: {gameStats.winner.bestRound}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Detailed Scores Table */}
      <motion.div
        variants={fadeIn}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/80">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                  {t.games.round}
                </th>
                {playerStats.map((player) => (
                  <th
                    key={player.playerId}
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[180px]"
                  >
                    <Link
                      href={`/players/${player.playerId}`}
                      className="hover:text-primary-600 transition-colors block"
                    >
                      <div className="flex items-center gap-1 truncate">
                        <span className="truncate">{player.displayName}</span>
                        {(() => {
                          const gamePlayer = game.players.find(p => p.id === player.playerId);
                          if (!gamePlayer) return null;
                          if (!('isGuest' in gamePlayer) && 'verified' in gamePlayer && (gamePlayer as UserProfile).verified) {
                            return <VerifiedBadge size="xs" />;
                          }
                          if ('isGuest' in gamePlayer) {
                            return (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                Guest
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {Array.from({ length: 5 }, (_, roundIndex) => (
                <tr key={roundIndex + 1} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                    <div className="flex items-center">
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-gray-100 text-gray-700 font-semibold">
                        {roundIndex + 1}
                      </span>
                    </div>
                  </td>
                  {playerStats.map((player) => {
                    const score = player.rounds[roundIndex + 1];
                    const relativeScore = player.relativeScores[roundIndex + 1];
                    const isHighestInRound = score === Math.max(
                      ...playerStats.map(p => p.rounds[roundIndex + 1] || 0)
                    );
                    
                    return (
                      <td
                        key={player.playerId}
                        className="px-6 py-4 whitespace-nowrap text-sm"
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`${isHighestInRound ? 'font-bold text-primary-600 text-base' : 'text-gray-900'}`}>
                            {score || '-'}
                          </span>
                          {score && (
                            <span
                              className={`inline-flex items-center text-xs font-medium ${
                                relativeScore >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {relativeScore >= 0 ? '+' : ''}{relativeScore}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Summary rows */}
              <tr className="bg-gray-50/70 border-t-2 border-gray-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-600">
                  {t.games.average}
                </td>
                {playerStats.map((player) => (
                  <td
                    key={player.playerId}
                    className="px-6 py-4 whitespace-nowrap text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-gray-900">{player.averageScore}</span>
                        <span
                          className={`inline-flex items-center text-xs font-medium ${
                            player.relativeAverage >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {player.relativeAverage >= 0 ? '+' : ''}{player.relativeAverage}
                        </span>
                        {player.isNewBestAverage && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200 animate-pulse">
                            {t.games.newBest}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-600">
                  {t.games.bestAverage}
                </td>
                {playerStats.map((player) => (
                  <td
                    key={player.playerId}
                    className="px-6 py-4 whitespace-nowrap text-sm"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-900">{player.bestAverageInGame}</span>
                      {player.isNewBestAverage && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200">
                          {t.games.newRecord}
                        </span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
              <tr className="bg-primary-50/30 border-t-2 border-primary-100">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
                  {t.games.total}
                </td>
                {playerStats.map((player) => (
                  <td
                    key={player.playerId}
                    className={`px-6 py-4 whitespace-nowrap text-base ${
                      player.totalScore === gameStats.winner.totalScore
                        ? 'font-bold text-primary-600'
                        : 'font-semibold text-gray-900'
                    }`}
                  >
                    {player.totalScore}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* All Players Progress Chart */}
      <motion.div
        variants={fadeIn}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ChartBarIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {t.games.allPlayersProgress || 'All Players Progress'}
            </h3>
          </div>
          
          <div className="h-64 sm:h-80">
            <Line 
              data={{
                labels: ['R1', 'R2', 'R3', 'R4', 'R5'],
                datasets: playerStats.map((player, index) => {
                  const roundScores = [1, 2, 3, 4, 5].map(r => player.rounds[r] || null);
                  
                  const colors = [
                    '#3B82F6', // Blue
                    '#10B981', // Green
                    '#F59E0B', // Amber
                    '#EF4444', // Red
                    '#8B5CF6', // Purple
                    '#EC4899', // Pink
                    '#14B8A6', // Teal
                    '#F97316', // Orange
                  ];
                  
                  const color = colors[index % colors.length];
                  const isWinner = player.playerId === gameStats?.winner.playerId;
                  
                  return {
                    label: player.displayName,
                    data: roundScores,
                    borderColor: color,
                    backgroundColor: color + '20', // Add transparency
                    tension: 0.3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    borderWidth: isWinner ? 3 : 2,
                    spanGaps: false,
                    ...(isWinner && { 
                      borderDash: undefined,
                      pointRadius: 6,
                      pointHoverRadius: 8,
                    })
                  };
                })
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                    labels: {
                      boxWidth: 12,
                      usePointStyle: true,
                      pointStyle: 'circle',
                      font: {
                        size: 12
                      },
                      generateLabels: (chart) => {
                        const datasets = chart.data.datasets;
                        return datasets.map((dataset, i) => ({
                          text: dataset.label || '',
                          fillStyle: dataset.borderColor as string,
                          strokeStyle: dataset.borderColor as string,
                          lineWidth: dataset.borderWidth as number,
                          hidden: !chart.isDatasetVisible(i),
                          index: i,
                          pointStyle: 'circle',
                          // Add winner indicator
                          fontStyle: playerStats[i]?.playerId === gameStats?.winner.playerId ? 'bold' : 'normal'
                        }));
                      }
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: (context: any) => {
                        if (context.parsed.y === null) return '';
                        const playerName = context.dataset.label;
                        const isWinner = playerStats.find(p => p.displayName === playerName)?.playerId === gameStats?.winner.playerId;
                        return `${playerName}: ${context.parsed.y} ${t.games.pts}${isWinner ? ' 👑' : ''}`;
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: t.games.rounds
                    }
                  },
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: t.games.score
                    }
                  }
                }
              }}
            />
          </div>

          {/* Quick Stats Below Chart */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500">{t.games.highestScore}</p>
              <p className="text-lg font-semibold text-gray-900">{gameStats?.highestScore}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">{t.games.lowestScore}</p>
              <p className="text-lg font-semibold text-gray-900">{gameStats?.lowestScore}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">{t.games.averageScore}</p>
              <p className="text-lg font-semibold text-gray-900">{gameStats?.overallAverage}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">{t.games.players}</p>
              <p className="text-lg font-semibold text-gray-900">{playerStats.length}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Player Performance Cards */}
      <motion.div
        variants={fadeIn}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {playerStats.map((player) => {
          const isBestRound = player.playerId === gameStats.bestSingleRoundPlayer.playerId;
          const isBestAverage = player.playerId === gameStats.bestAveragePlayer.playerId;
          
          return (
            <div key={player.playerId}>
              <Link
                href={`/players/${player.playerId}`}
                className="block bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-primary-200 hover:shadow-md transition-all group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-4">
                    <UserCircleIcon className="h-6 w-6 text-gray-400 group-hover:text-primary-600 transition-colors" />
                    <h3 className="font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">{player.displayName}</h3>
                    {(() => {
                      const gamePlayer = game.players.find(p => p.id === player.playerId);
                      if (!gamePlayer) return null;
                      if (!('isGuest' in gamePlayer) && 'verified' in gamePlayer && (gamePlayer as UserProfile).verified) {
                        return <VerifiedBadge size="xs" />;
                      }
                      if ('isGuest' in gamePlayer) {
                        return (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            Guest
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <dl className="space-y-2">
                    <div className="flex items-center justify-between">
                      <dt className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">{t.games.bestRound}</dt>
                      <dd className="flex items-center space-x-1.5">
                        <span className={`text-sm font-medium ${isBestRound ? 'text-primary-600 font-bold' : 'text-gray-900'} group-hover:text-gray-950 transition-colors`}>{player.bestRound}</span>
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">{t.games.average}</dt>
                      <dd className="flex items-center gap-1.5">
                        {player.isNewBestAverage && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200 animate-pulse">
                            {t.games.newBest}
                          </span>
                        )}
                        <span
                          className={`text-xs font-medium ${
                            player.relativeAverage >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {player.relativeAverage >= 0 ? '+' : ''}{player.relativeAverage}
                        </span>
                        <span className="text-sm font-medium text-gray-900 group-hover:text-gray-950 transition-colors">{player.averageScore}</span>
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">{t.games.worstRound}</dt>
                      <dd className="text-sm font-medium text-gray-900 group-hover:text-gray-950 transition-colors">{player.worstRound}</dd>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <dt className="text-sm font-medium text-gray-500 group-hover:text-gray-600 transition-colors">{t.games.totalScore}</dt>
                      <dd className="text-sm font-bold text-primary-600">{player.totalScore}</dd>
                    </div>
                  </dl>
                </div>
              </Link>
            </div>
          );
        })}
      </motion.div>
    </motion.div>
  );
} 