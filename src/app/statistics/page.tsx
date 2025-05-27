'use client';

import { useState, useEffect } from 'react';
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
import { useAuth } from '@/lib/context/auth-context';
import { GameService } from '@/features/games/services/game-service';
import { Game } from '@/features/games/types';
import { fadeIn, staggerChildren } from '@/shared/styles/animations';
import { TrophyIcon, ChartBarIcon } from '@heroicons/react/24/outline';

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

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

interface FirestoreValue {
  integerValue?: string;
  timestampValue?: string;
  stringValue?: string;
  mapValue?: {
    fields: Record<string, FirestoreValue>;
  };
}

interface PlayerStats {
  gamesPlayed: number;
  averageScore: number;
  personalBest: number;
  scoreHistory: { date: Date; score: number }[];
  averageScoreHistory: { date: Date; average: number }[];
}

export default function StatisticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.uid) return;

      try {
        // Fetch all finished games for the user
        const finishedGames = await GameService.getFinishedGames(user.uid);
        
        // Process games to calculate statistics
        const playerStats = processGames(finishedGames, user.uid);
        setStats(playerStats);
      } catch (err) {
        setError('Failed to load statistics');
        console.error('Error loading statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.uid]);

  const processGames = (games: Game[], userId: string): PlayerStats => {
    console.log('Processing games:', games);
    console.log('For user:', userId);

    const stats: PlayerStats = {
      gamesPlayed: 0,
      averageScore: 0,
      personalBest: 0,
      scoreHistory: [],
      averageScoreHistory: []
    };

    // Filter games where the user participated
    const userGames = games
      .filter(game => {
        // Check if the game has valid scores for the user
        return game.scores && game.scores[userId]?.rounds;
      })
      .sort((gameA, gameB) => {
        // Convert Firestore timestamps to milliseconds
        const getTimestamp = (game: Game) => {
          if (game.createdAt instanceof Date) {
            return game.createdAt.getTime();
          }
          // Handle Firestore timestamp
          if (typeof game.createdAt === 'object' && game.createdAt !== null && 'seconds' in game.createdAt) {
            const timestamp = game.createdAt as FirestoreTimestamp;
            return timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000;
          }
          return new Date(game.createdAt).getTime();
        };
        return getTimestamp(gameA) - getTimestamp(gameB);
      });
    
    console.log('Filtered user games:', userGames);
    
    let totalScore = 0;
    let gamesCount = 0;

    userGames.forEach(game => {
      console.log('Processing game:', game);
      const playerScores = game.scores[userId];
      console.log('Player scores:', playerScores);
      
      if (!playerScores?.rounds) {
        console.log('No rounds found for player');
        return;
      }

      // Convert Firestore timestamp to Date
      let gameDate: Date;
      if (game.createdAt instanceof Date) {
        gameDate = game.createdAt;
      } else if (typeof game.createdAt === 'object' && game.createdAt !== null && 'seconds' in game.createdAt) {
        const timestamp = game.createdAt as FirestoreTimestamp;
        gameDate = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
      } else {
        gameDate = new Date(game.createdAt);
      }

      console.log('Game date:', gameDate);

      if (isNaN(gameDate.getTime())) {
        console.error('Invalid game date:', game.createdAt);
        return;
      }

      // Process each round's scores
      Object.entries(playerScores.rounds).forEach(([round, score]) => {
        const roundDate = new Date(gameDate);
        roundDate.setMinutes(roundDate.getMinutes() + parseInt(round));

        let numericScore = 0;
        if (typeof score === 'number') {
          numericScore = score;
        } else if (typeof score === 'object' && score !== null) {
          const firestoreScore = score as { integerValue?: string };
          numericScore = parseInt(firestoreScore.integerValue || '0');
        }
        
        if (!isNaN(numericScore)) {
          stats.scoreHistory.push({
            date: roundDate,
            score: numericScore
          });

          // Update personal best
          stats.personalBest = Math.max(stats.personalBest, numericScore);

          // Add to total for average calculation
          totalScore += numericScore;
        }
      });

      gamesCount++;
    });

    // Sort histories by date
    stats.scoreHistory.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate running average history
    let runningTotal = 0;
    stats.averageScoreHistory = stats.scoreHistory.map((entry, index) => {
      runningTotal += entry.score;
      return {
        date: entry.date,
        average: Math.round(runningTotal / (index + 1))
      };
    });

    // Calculate final statistics
    stats.gamesPlayed = gamesCount;
    stats.averageScore = stats.scoreHistory.length > 0
      ? Math.round(totalScore / stats.scoreHistory.length)
      : 0;

    console.log('Final stats:', stats);
    console.log('Score history:', stats.scoreHistory);
    console.log('Average history:', stats.averageScoreHistory);

    return stats;
  };

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
            return new Date(context[0].parsed.x).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
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
          },
          tooltipFormat: 'PP'
        },
        title: {
          display: true,
          text: 'Date'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        max: 150,
        title: {
          display: true,
          text: 'Score'
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
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
            {error || 'Failed to load statistics'}
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
          {/* Header */}
          <motion.div variants={fadeIn} className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">Your Statistics</h1>
            <p className="mt-4 text-lg text-gray-600">
              Track your progress and performance over time
            </p>
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Games Played</dt>
                      <dd className="text-2xl font-semibold text-gray-900">{stats.gamesPlayed}</dd>
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Average Score</dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {Math.round(stats.averageScore)}
                      </dd>
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
                          x: entry.date.getTime(),
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
                  options={chartOptions}
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
                          x: entry.date.getTime(),
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
                  options={chartOptions}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 