'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
  Legend,
  Filler,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { UserCircleIcon, TrophyIcon, ChartBarIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { GameService } from '@/features/games/services/game-service';
import { fadeIn, staggerChildren } from '@/shared/styles/animations';
import { LeaderboardService } from '@/features/leaderboard/services/leaderboard-service';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
);

interface PlayerStats {
  gamesPlayed: number;
  averageScore: number;
  personalBest: number;
  bestAverage: number;
  scoreHistory: { date: Date; score: number; relativeScore: number }[];
  averageScoreHistory: { date: Date; average: number }[];
}

export default function PlayerProfilePage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [lastPlayed, setLastPlayed] = useState<Date | null>(null);

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch leaderboard data
        console.log('Fetching leaderboard data...');
        const leaderboardData = await LeaderboardService.getLeaderboard();
        console.log('Leaderboard data:', leaderboardData);
        
        const playerData = leaderboardData.find(player => player.playerId === id);
        console.log('Player data:', playerData);

        if (!playerData) {
          console.log('No player data found');
          // For new users without any games, show empty stats
          setPlayerName('New Player');
          setLastPlayed(null);
          setStats({
            gamesPlayed: 0,
            averageScore: 0,
            personalBest: 0,
            bestAverage: 0,
            scoreHistory: [],
            averageScoreHistory: []
          });
          setLoading(false);
          return;
        }

        setPlayerName(playerData.displayName);
        setLastPlayed(playerData.lastPlayed);

        // Convert leaderboard data to chart format
        console.log('Converting score history:', playerData.scoreHistory);
        const scoreHistory = playerData.scoreHistory.map(score => {
          const relativeScore = score.score - playerData.bestAverageInGame;
          console.log(`Calculating relative score: ${score.score} - ${playerData.bestAverageInGame} = ${relativeScore}`);
          return {
            date: new Date(score.timestamp),
            score: score.score,
            relativeScore
          };
        });
        console.log('Converted score history:', scoreHistory);

        // Sort by date
        scoreHistory.sort((a, b) => a.date.getTime() - b.date.getTime());
        console.log('Sorted score history:', scoreHistory);

        // Calculate running average
        let runningTotal = 0;
        const averageScoreHistory = scoreHistory.map((entry, index) => {
          runningTotal += entry.score;
          return {
            date: entry.date,
            average: Math.round(runningTotal / (index + 1))
          };
        });
        console.log('Average score history:', averageScoreHistory);

        const stats = {
          gamesPlayed: playerData.gamesPlayed,
          averageScore: playerData.averageScore,
          personalBest: playerData.bestScore,
          bestAverage: playerData.bestAverageInGame,
          scoreHistory: scoreHistory,
          averageScoreHistory: averageScoreHistory
        };
        console.log('Final stats:', stats);
        setStats(stats);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load player statistics');
        console.error('Error loading player statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [id]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 10,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          title: (context: any) => {
            if (!context[0]?.parsed?.x) return '';
            return new Date(context[0].parsed.x).toLocaleDateString();
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
          displayFormats: {
            day: 'MMM d'
          }
        },
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Score'
        }
      }
    }
  };

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

  if (error || !stats) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex items-center justify-center min-h-screen py-12"
      >
        <div className="rounded-md bg-red-50 p-4">
          <h3 className="text-sm font-medium text-red-800">
            {error || 'Failed to load player statistics'}
          </h3>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
          className="space-y-8"
        >
          {/* Player Header */}
          <motion.div variants={fadeIn} className="text-center">
            <div className="flex justify-center mb-4">
              <UserCircleIcon className="h-20 w-20 text-gray-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">{playerName}</h1>
            <div className="mt-4 flex justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <ChartBarIcon className="h-5 w-5" />
                <span>{stats.gamesPlayed} games played</span>
              </div>
              {lastPlayed && (
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-5 w-5" />
                  <span>Last played {lastPlayed.toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Stats Overview */}
          <motion.div variants={fadeIn} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Average Score */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Average Score</dt>
                      <dd className="text-2xl font-semibold text-gray-900">{stats.averageScore}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Best Average */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 text-emerald-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Best Average</dt>
                      <dd className="text-2xl font-semibold text-gray-900">{stats.bestAverage}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Best */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrophyIcon className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Personal Best</dt>
                      <dd className="text-2xl font-semibold text-gray-900">{stats.personalBest}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Games Played */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Games Played</dt>
                      <dd className="text-2xl font-semibold text-gray-900">{stats.gamesPlayed}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Charts */}
          <motion.div variants={fadeIn} className="space-y-6">
            {/* Score History Chart */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Score History</h3>
              <div className="h-[300px] sm:h-[400px]">
                <Line
                  data={{
                    datasets: [
                      {
                        label: 'Score',
                        data: stats.scoreHistory.map(entry => ({
                          x: entry.date,
                          y: entry.score
                        })),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: false,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6
                      }
                    ]
                  }}
                  options={{
                    ...chartOptions,
                    scales: {
                      ...chartOptions.scales,
                      x: {
                        type: 'time',
                        time: {
                          unit: 'minute',
                          displayFormats: {
                            minute: 'HH:mm',
                            hour: 'HH:mm',
                            day: 'MMM D'
                          }
                        },
                        title: {
                          display: true,
                          text: 'Time'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Relative Score Chart */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Relative to Personal Best Average ({stats.bestAverage})</h3>
              <div className="h-[300px] sm:h-[400px]">
                <Line
                  data={{
                    datasets: [
                      {
                        label: 'Points vs Best Average',
                        data: stats.scoreHistory.map(entry => ({
                          x: entry.date,
                          y: entry.relativeScore
                        })),
                        segment: {
                          borderColor: ctx => {
                            const prev = ctx.p0.parsed.y;
                            const curr = ctx.p1.parsed.y;
                            return (prev >= 0 && curr >= 0) ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
                          }
                        },
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: (ctx) => {
                          if (!ctx?.parsed?.y) return 'rgb(59, 130, 246)';
                          return ctx.parsed.y >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
                        }
                      }
                    ]
                  }}
                  options={{
                    ...chartOptions,
                    scales: {
                      ...chartOptions.scales,
                      x: {
                        type: 'time',
                        time: {
                          unit: 'minute',
                          displayFormats: {
                            minute: 'HH:mm',
                            hour: 'HH:mm',
                            day: 'MMM D'
                          }
                        },
                        title: {
                          display: true,
                          text: 'Time'
                        }
                      },
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: `Points Relative to Best Average (${stats.bestAverage})`
                        },
                        grid: {
                          color: (context) => {
                            if (context.tick.value === 0) {
                              return 'rgba(0, 0, 0, 0.2)';
                            }
                            return 'rgba(0, 0, 0, 0.1)';
                          }
                        }
                      }
                    },
                    plugins: {
                      ...chartOptions.plugins,
                      tooltip: {
                        ...chartOptions.plugins.tooltip,
                        callbacks: {
                          label: (context) => {
                            if (!context?.parsed?.y) return '';
                            const score = context.parsed.y;
                            const rawData = context.raw as { x: Date; y: number };
                            return `Score: ${score >= 0 ? '+' : ''}${score} (${rawData.y} vs ${stats.bestAverage})`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Score History Table */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Round History</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">vs Best Avg ({stats.bestAverage})</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.scoreHistory.map((entry, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.date.toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.score}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              entry.relativeScore >= 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                            title={`${entry.score} - ${stats.bestAverage} = ${entry.relativeScore}`}
                          >
                            {entry.relativeScore >= 0 ? (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                                +{entry.relativeScore}
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                                {entry.relativeScore}
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Average Score Trend */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Score Progression</h3>
              <div className="h-[300px] sm:h-[400px]">
                <Line
                  data={{
                    datasets: [
                      {
                        label: 'Average Score',
                        data: stats.averageScoreHistory.map(entry => ({
                          x: entry.date,
                          y: entry.average
                        })),
                        borderColor: 'rgb(16, 185, 129)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6
                      }
                    ]
                  }}
                  options={{
                    ...chartOptions,
                    scales: {
                      ...chartOptions.scales,
                      x: {
                        type: 'time',
                        time: {
                          unit: 'minute',
                          displayFormats: {
                            minute: 'HH:mm',
                            hour: 'HH:mm',
                            day: 'MMM D'
                          }
                        },
                        title: {
                          display: true,
                          text: 'Time'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 