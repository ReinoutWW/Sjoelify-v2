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
  scoreHistory: { date: Date; score: number }[];
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
        const scoreHistory = playerData.scoreHistory.map(score => ({
          date: new Date(score.timestamp),
          score: score.score
        }));
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
          <motion.div variants={fadeIn} className="grid grid-cols-1 gap-5 sm:grid-cols-3">
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

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-gray-400" />
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