'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { fadeIn } from '@/shared/styles/animations';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { GameService } from '@/features/games/services/game-service';
import { Game } from '@/features/games/types';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface GatePerformanceData {
  labels: string[]; // Round identifiers (e.g., "Game 1 - R1")
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    pointRadius: number;
    pointHoverRadius: number;
  }[];
}

interface GateStats {
  gateNumber: number;
  average: number;
  total: number;
  trend: 'up' | 'down' | 'stable';
  performance: 'excellent' | 'good' | 'needs-improvement';
}

interface GatePerformanceChartProps {
  playerId: string;
  timePeriod?: 'week' | 'month' | 'year' | 'all';
}

export function GatePerformanceChart({ playerId, timePeriod = 'all' }: GatePerformanceChartProps) {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<GatePerformanceData | null>(null);
  const [gateStats, setGateStats] = useState<GateStats[]>([]);
  const { t } = useTranslation();

  // Sjoelen gate order: 2, 3, 4, 1 (matching the point values)
  const gateOrder = [2, 3, 4, 1];
  const gateColors = {
    1: { border: '#3B82F6', bg: '#DBEAFE' }, // Blue for 1 point
    2: { border: '#10B981', bg: '#D1FAE5' }, // Green for 2 points
    3: { border: '#F59E0B', bg: '#FEF3C7' }, // Amber for 3 points
    4: { border: '#EF4444', bg: '#FEE2E2' }  // Red for 4 points
  };

  // Helper function to render dots for a gate
  const renderGateDots = (gateNumber: number) => {
    const dots = [];
    for (let i = 0; i < gateNumber; i++) {
      dots.push(
        <div 
          key={i} 
          className="w-1.5 h-1.5 bg-blue-500 rounded-full"
        />
      );
    }
    return <div className="flex gap-0.5 items-center">{dots}</div>;
  };

  useEffect(() => {
    const fetchGatePerformance = async () => {
      try {
        setLoading(true);
        
        // Fetch all games for the player
        const { collection, query, where, getDocs, orderBy, Timestamp } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/config');
        
        // Calculate cutoff date for time period
        let cutoffDate: Date | null = null;
        if (timePeriod !== 'all') {
          const now = new Date();
          switch (timePeriod) {
            case 'week':
              cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case 'month':
              cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              break;
            case 'year':
              cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
              break;
          }
          if (cutoffDate) {
            cutoffDate.setHours(0, 0, 0, 0);
          }
        }

        // Build query with date filter if needed
        let gamesQuery;
        if (cutoffDate) {
          const cutoffTimestamp = Timestamp.fromDate(cutoffDate);
          
          gamesQuery = query(
            collection(db, 'games'),
            where('playerIds', 'array-contains', playerId),
            where('isClosed', '==', true),
            where('createdAt', '>=', cutoffTimestamp),
            orderBy('createdAt', 'desc')
          );
        } else {
          gamesQuery = query(
            collection(db, 'games'),
            where('playerIds', 'array-contains', playerId),
            where('isClosed', '==', true),
            orderBy('createdAt', 'desc')
          );
        }
        
        const gamesSnapshot = await getDocs(gamesQuery);
        let games = gamesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Game));

        // Extract gate performance data
        const labels: string[] = [];
        const gateData: number[][] = [[], [], [], []]; // 4 gates
        let gamesWithRoundDetails = 0;
        
        games.reverse().forEach((game, gameIndex) => {
          const playerScore = game.scores[playerId];
          if (!playerScore?.roundDetails) {
            return;
          }
          
          gamesWithRoundDetails++;
          
          // Process each round
          Object.entries(playerScore.roundDetails).forEach(([roundNum, gateString]) => {
            labels.push(`G${gameIndex + 1}-R${roundNum}`);
            
            // Parse gate string - handle both formats: "7797" and "11.7.9.7"
            let gateScores: number[];
            if (gateString.includes('.')) {
              // Dot-delimited format for double digits
              gateScores = gateString.split('.').map(s => parseInt(s) || 0);
            } else {
              // Single digit format
              gateScores = gateString.split('').map(s => parseInt(s) || 0);
            }
            
            // Ensure we have exactly 4 values
            while (gateScores.length < 4) {
              gateScores.push(0);
            }
            
            // Add scores to gate data
            for (let i = 0; i < 4; i++) {
              gateData[i].push(gateScores[i] || 0);
            }
          });
        });

        console.log(`[GatePerformance] Period: ${timePeriod}, Games: ${games.length}, With gate data: ${gamesWithRoundDetails}`);

        // Calculate statistics for each gate (in order 2,3,4,1)
        const stats: GateStats[] = gateData.map((data, index) => {
          const actualGateNumber = gateOrder[index]; // Map display index to actual gate number
          const total = data.reduce((sum, val) => sum + val, 0);
          const average = data.length > 0 ? total / data.length : 0;
          
          // Calculate trend (compare last 5 vs previous 5)
          let trend: 'up' | 'down' | 'stable' = 'stable';
          if (data.length >= 10) {
            const recent = data.slice(-5).reduce((a, b) => a + b, 0) / 5;
            const previous = data.slice(-10, -5).reduce((a, b) => a + b, 0) / 5;
            if (recent > previous * 1.1) trend = 'up';
            else if (recent < previous * 0.9) trend = 'down';
          }
          
          // Determine performance level
          let performance: 'excellent' | 'good' | 'needs-improvement' = 'good';
          if (average >= 7) performance = 'excellent';
          else if (average < 5) performance = 'needs-improvement';
          
          return {
            gateNumber: actualGateNumber,
            average: Math.round(average * 10) / 10,
            total,
            trend,
            performance
          };
        });
        
        setGateStats(stats);

        // Prepare chart data with correct gate labels
        const datasets = gateData.map((data, index) => {
          const actualGateNumber = gateOrder[index];
          
          return {
            label: `${t.games.gate} ${actualGateNumber} (${actualGateNumber}${t.games.pts})`,
            data,
            borderColor: gateColors[actualGateNumber as keyof typeof gateColors].border,
            backgroundColor: gateColors[actualGateNumber as keyof typeof gateColors].bg,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6
          };
        });

        setChartData({ labels, datasets });
      } catch (error) {
        console.error('Error fetching gate performance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGatePerformance();
  }, [playerId, timePeriod, t.games.gate, t.games.pts]);

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
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (context: any) => {
            // Extract gate number from dataset label (e.g., "Gate 2 (2pts)" -> 2)
            const gateMatch = context.dataset.label.match(/Gate (\d+)/);
            const gateNumber = gateMatch ? parseInt(gateMatch[1]) : 1;
            const discs = context.parsed.y;
            const points = discs * gateNumber;
            return `${context.dataset.label}: ${discs} ${t.games.discs} (${points} ${t.games.pts})`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: `${t.navigation.games} & ${t.games.rounds}`
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        max: 10,
        title: {
          display: true,
          text: t.games.discsPerGate
        },
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    );
  }

  if (!chartData || chartData.labels.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{t.profile.gatePerformance}</h3>
        <p className="text-gray-500 text-center py-8">{t.profile.noGateData}</p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={fadeIn}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">{t.profile.gatePerformance}</h3>
          <SparklesIcon className="h-5 w-5 text-gray-400" />
        </div>

        {/* Gate Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {gateOrder.map((gateNumber, index) => {
            const stat = gateStats.find(s => s.gateNumber === gateNumber);
            if (!stat) return null;
            
            return (
              <div 
                key={gateNumber}
                className={`p-3 rounded-lg border ${
                  stat.performance === 'excellent' 
                    ? 'bg-green-50 border-green-200' 
                    : stat.performance === 'needs-improvement'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  {renderGateDots(gateNumber)}
                  {stat.trend === 'up' && (
                    <svg className="h-3 w-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  )}
                  {stat.trend === 'down' && (
                    <svg className="h-3 w-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                  )}
                </div>
                <p className="text-lg font-semibold text-gray-900">{stat.average}</p>
                <p className="text-xs text-gray-500">{gateNumber}{t.games.pts}/{t.games.disc}</p>
              </div>
            );
          })}
        </div>

        {/* Line Chart */}
        <div className="h-64 sm:h-80">
          <Line data={chartData} options={chartOptions} />
        </div>

        {/* Performance Tips */}
        <div className="mt-6 space-y-2">
          {gateStats.filter(s => s.performance === 'needs-improvement').map((stat) => (
            <div key={stat.gateNumber} className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <svg className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">
                  {t.profile.gateNeedsAttention.replace('{gate}', stat.gateNumber.toString())}
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {t.games.average}: {stat.average} {t.games.discs} ({stat.gateNumber}{t.games.pts} {t.profile.each})
                </p>
              </div>
            </div>
          ))}
          {gateStats.filter(s => s.performance === 'excellent').length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
              <svg className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">
                  {t.profile.excellentGatePerformance}: {gateStats.filter(s => s.performance === 'excellent').map(s => s.gateNumber).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 