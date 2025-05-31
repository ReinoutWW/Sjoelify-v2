'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useTranslation } from '@/lib/hooks/useTranslation';
import { Game, PlayerScore } from '@/features/games/types';
import { UserProfile } from '@/features/account/types';
import { XMarkIcon, TrophyIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { GameService } from '@/features/games/services/game-service';

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

interface InGameStatsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  player: UserProfile | { id: string; displayName: string; isGuest: true };
  currentGame: Game;
}

interface BestGameData {
  game: Game;
  average: number;
  roundScores: number[];
}

export function InGameStatsPopup({ isOpen, onClose, player, currentGame }: InGameStatsPopupProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [bestGame, setBestGame] = useState<BestGameData | null>(null);
  const [activeTab, setActiveTab] = useState<'best' | 'players'>('best');
  
  const isGuest = 'isGuest' in player && player.isGuest;

  useEffect(() => {
    if (!isOpen || isGuest) return;
    
    const fetchBestGame = async () => {
      try {
        setLoading(true);
        
        // Fetch all closed games for this player
        const { collection, query, where, getDocs, orderBy, limit } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/config');
        
        const gamesQuery = query(
          collection(db, 'games'),
          where('playerIds', 'array-contains', player.id),
          where('isClosed', '==', true),
          orderBy('createdAt', 'desc')
        );
        
        const gamesSnapshot = await getDocs(gamesQuery);
        const games = await Promise.all(
          gamesSnapshot.docs.map(async doc => {
            const game = await GameService.getGame(doc.id);
            return game;
          })
        );
        
        // Find the game with the highest average for this player
        let bestGameData: BestGameData | null = null;
        let highestAverage = 0;
        
        games.forEach(game => {
          if (!game) return;
          const playerScore = game.scores[player.id];
          if (!playerScore) return;
          
          const roundCount = Object.keys(playerScore.rounds).length;
          if (roundCount !== 5) return; // Only consider complete games
          
          const average = playerScore.total / roundCount;
          if (average > highestAverage) {
            highestAverage = average;
            const roundScores = [1, 2, 3, 4, 5].map(r => playerScore.rounds[r] || 0);
            bestGameData = {
              game,
              average,
              roundScores
            };
          }
        });
        
        setBestGame(bestGameData);
      } catch (error) {
        console.error('Error fetching best game:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBestGame();
  }, [isOpen, player.id, isGuest]);

  // Get current game data
  const currentPlayerScore = currentGame.scores[player.id];
  const currentRounds = currentPlayerScore ? Object.keys(currentPlayerScore.rounds).length : 0;
  const currentAverage = currentPlayerScore && currentRounds > 0 
    ? currentPlayerScore.total / currentRounds 
    : 0;
  const currentRoundScores = currentPlayerScore 
    ? [1, 2, 3, 4, 5].map(r => currentPlayerScore.rounds[r] || null)
    : [];

  // Prepare chart data for best comparison
  const chartData = {
    labels: ['R1', 'R2', 'R3', 'R4', 'R5'],
    datasets: [
      {
        label: t.games.currentGame,
        data: currentRoundScores,
        borderColor: '#3B82F6',
        backgroundColor: '#DBEAFE',
        tension: 0.3,
        pointRadius: 6,
        pointHoverRadius: 8,
        borderWidth: 3,
        spanGaps: false // Don't connect null values
      },
      ...(bestGame && !isGuest ? [{
        label: t.games.bestGame,
        data: bestGame.roundScores,
        borderColor: '#10B981',
        backgroundColor: '#D1FAE5',
        tension: 0.3,
        pointRadius: 6,
        pointHoverRadius: 8,
        borderWidth: 2,
        borderDash: [5, 5]
      }] : [])
    ]
  };

  // Prepare chart data for all players comparison
  const allPlayersChartData = {
    labels: ['R1', 'R2', 'R3', 'R4', 'R5'],
    datasets: currentGame.players.map((p, index) => {
      const playerScore = currentGame.scores[p.id];
      const roundScores = playerScore 
        ? [1, 2, 3, 4, 5].map(r => playerScore.rounds[r] || null)
        : [];
      
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
      const isCurrentPlayer = p.id === player.id;
      
      return {
        label: p.displayName,
        data: roundScores,
        borderColor: color,
        backgroundColor: color + '20', // Add transparency
        tension: 0.3,
        pointRadius: isCurrentPlayer ? 6 : 4,
        pointHoverRadius: isCurrentPlayer ? 8 : 6,
        borderWidth: isCurrentPlayer ? 3 : 2,
        spanGaps: false,
        ...(isCurrentPlayer && { borderDash: [5, 5] })
      };
    })
  };

  const chartOptions = {
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
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            if (context.parsed.y === null) return;
            return `${context.dataset.label}: ${context.parsed.y} ${t.games.pts}`;
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
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="flex min-h-full items-center justify-center p-4">
              <div 
                className="w-full max-w-lg bg-white rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between rounded-t-xl">
                  <h3 className="text-lg font-semibold text-gray-900">{player.displayName}</h3>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* Tabs */}
                  <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                    <button
                      onClick={() => setActiveTab('best')}
                      className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        activeTab === 'best'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {t.games.comparedToBest || 'Compared to best'}
                    </button>
                    <button
                      onClick={() => setActiveTab('players')}
                      className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        activeTab === 'players'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {t.games.players}
                    </button>
                  </div>

                  {/* Tab Content */}
                  {activeTab === 'best' ? (
                    <>
                      {/* Current Game Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <ChartBarIcon className="w-4 w-4 text-blue-600" />
                            <p className="text-xs font-medium text-blue-900">{t.games.currentAverage}</p>
                          </div>
                          <p className="text-xl font-bold text-blue-900">
                            {currentAverage.toFixed(1)}
                          </p>
                          <p className="text-xs text-blue-700 mt-0.5">
                            {t.games.round} {currentRounds}/5
                          </p>
                        </div>
                        
                        <div className="bg-purple-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <TrophyIcon className="w-4 w-4 text-purple-600" />
                            <p className="text-xs font-medium text-purple-900">{t.games.bestAverage}</p>
                          </div>
                          <p className="text-xl font-bold text-purple-900">
                            {bestGame && !isGuest ? bestGame.average.toFixed(1) : '-'}
                          </p>
                          <p className="text-xs text-purple-700 mt-0.5">
                            {t.games.bestGame}
                          </p>
                        </div>
                      </div>

                      {/* Progress vs Best Game */}
                      {!isGuest && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">
                            {bestGame ? t.games.progressVsBest : t.games.progressChart}
                          </h4>
                          {loading ? (
                            <div className="h-48 flex items-center justify-center">
                              <div className="animate-pulse text-gray-400">{t.common.loading}</div>
                            </div>
                          ) : (
                            <div className="h-48">
                              <Line data={chartData} options={chartOptions} />
                            </div>
                          )}
                          
                          {bestGame && currentRounds > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">{t.games.projectedFinal}:</span>
                                <span className={`font-semibold ${
                                  currentAverage >= bestGame.average ? 'text-green-600' : 'text-gray-900'
                                }`}>
                                  {(currentAverage * 5).toFixed(0)} 
                                  {currentAverage >= bestGame.average && ' 🎯'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm mt-1">
                                <span className="text-gray-600">{t.games.bestGameScore}:</span>
                                <span className="font-semibold text-gray-900">
                                  {(bestGame.average * 5).toFixed(0)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Guest Message */}
                      {isGuest && (
                        <div className="bg-amber-50 rounded-lg p-4">
                          <p className="text-sm text-amber-800">
                            {t.games.guestNoHistory}
                          </p>
                        </div>
                      )}

                      {/* Comparison to Best */}
                      {!isGuest && bestGame && currentAverage > 0 && (
                        <div className="text-center py-2">
                          <p className="text-sm text-gray-600">
                            {currentAverage >= bestGame.average ? (
                              <span className="text-green-600 font-medium">
                                {t.games.onTrackForNewBest} 🚀
                              </span>
                            ) : (
                              <>
                                {t.games.behindBestBy}{' '}
                                <span className="font-medium text-gray-900">
                                  {(bestGame.average - currentAverage).toFixed(1)}
                                </span>{' '}
                                {t.games.pointsPerRound}
                              </>
                            )}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Players Tab Content */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                          {t.games.allPlayersProgress || 'All Players Progress'}
                        </h4>
                        <div className="h-48">
                          <Line data={allPlayersChartData} options={chartOptions} />
                        </div>
                      </div>

                      {/* Player Rankings */}
                      <div className="space-y-2">
                        {currentGame.players
                          .map(p => ({
                            player: p,
                            score: currentGame.scores[p.id]?.total || 0,
                            rounds: currentGame.scores[p.id] ? Object.keys(currentGame.scores[p.id].rounds).length : 0
                          }))
                          .sort((a, b) => b.score - a.score)
                          .map((item, index) => (
                            <div 
                              key={item.player.id}
                              className={`flex items-center justify-between p-2 rounded-lg ${
                                item.player.id === player.id 
                                  ? 'bg-blue-50 border border-blue-200' 
                                  : 'bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${
                                  index === 0 ? 'text-yellow-600' : 'text-gray-600'
                                }`}>
                                  #{index + 1}
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                  {item.player.displayName}
                                </span>
                                {item.player.id === player.id && (
                                  <span className="text-xs text-blue-600">{t.games.you}</span>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">{item.score}</p>
                                <p className="text-xs text-gray-500">
                                  {item.rounds}/5 {t.games.rounds.toLowerCase()}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 