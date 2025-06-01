'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { UserCircleIcon, TrophyIcon, ChartBarIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { GameService } from '@/features/games/services/game-service';
import { fadeIn, staggerChildren } from '@/shared/styles/animations';
import { LeaderboardService } from '@/features/leaderboard/services/leaderboard-service';
import Link from 'next/link';
import { VerifiedBadge } from '@/shared/components/VerifiedBadge';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { useDateFormatter } from '@/lib/hooks/useDateFormatter';
import { useAuth } from '@/lib/context/auth-context';
import { UserSettingsService } from '@/features/account/services/user-settings-service';
import { FriendsService } from '@/features/friends/services/friends-service';
import { GatePerformanceChart } from '@/features/games/components/GatePerformanceChart';
import { AIProfileCoach } from '@/features/games/components/AIProfileCoach';
import { ShareButton } from '@/shared/components/ShareButton';

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

type TimePeriod = 'week' | 'month' | 'year' | 'all';

export default function PlayerProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [filteredStats, setFilteredStats] = useState<PlayerStats | null>(null);
  const [lastPlayed, setLastPlayed] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPrivate, setIsPrivate] = useState(false);
  const [canViewProfile, setCanViewProfile] = useState(true);
  const [profilePrivacyLevel, setProfilePrivacyLevel] = useState<'public' | 'friends' | 'private'>('public');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [aiCoachEnabled, setAiCoachEnabled] = useState(false);
  const [gateStats, setGateStats] = useState<any>(null);
  const itemsPerPage = 10;
  const router = useRouter();
  const { t } = useTranslation();
  const { formatDate } = useDateFormatter();

  // Check for AI Coach enabled settings on mount
  useEffect(() => {
    const checkUserSettings = async () => {
      if (user?.uid) {
        try {
          const settings = await UserSettingsService.getUserSettings(user.uid);
          setAiCoachEnabled(settings?.AICoachEnabled || false);
        } catch (error) {
          console.error('Error checking user settings:', error);
        }
      }
    };
    
    checkUserSettings();
  }, [user?.uid]);

  // Filter data based on time period
  useEffect(() => {
    if (!stats) {
      setFilteredStats(null);
      return;
    }

    const fetchFilteredGameData = async () => {
      const now = new Date();
      let cutoffDate: Date;

      switch (timePeriod) {
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'year':
          cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'all':
        default:
          // Show all data
          setFilteredStats(null);
          return;
      }

      try {
        // Fetch actual games for this player in the time period
        const { collection, query, where, getDocs, orderBy, Timestamp } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/config');
        
        const cutoffTimestamp = Timestamp.fromDate(cutoffDate);
        
        const gamesQuery = query(
          collection(db, 'games'),
          where('playerIds', 'array-contains', id),
          where('isClosed', '==', true),
          where('createdAt', '>=', cutoffTimestamp),
          orderBy('createdAt', 'desc')
        );
        
        const gamesSnapshot = await getDocs(gamesQuery);
        
        if (gamesSnapshot.empty) {
          setFilteredStats({
            gamesPlayed: 0,
            averageScore: 0,
            personalBest: 0,
            bestAverage: 0,
            scoreHistory: [],
            averageScoreHistory: []
          });
          setCurrentPage(1);
          return;
        }

        // Calculate stats from actual game data
        let allScores: { date: Date; score: number }[] = [];
        let bestGameAverage = 0;
        let gamesPlayed = 0;

        gamesSnapshot.docs.forEach(doc => {
          const gameData = doc.data();
          const playerScores = gameData.scores?.[id as string];
          
          if (playerScores?.rounds) {
            gamesPlayed++;
            const gameDate = gameData.createdAt?.toDate ? gameData.createdAt.toDate() : new Date(gameData.createdAt);
            
            // Get all round scores for this game
            const roundScores = Object.entries(playerScores.rounds)
              .map(([roundNum, score]) => ({
                round: parseInt(roundNum),
                score: score as number
              }))
              .sort((a, b) => a.round - b.round);
            
            // Calculate this game's average
            if (roundScores.length > 0) {
              const gameAverage = Math.round(
                roundScores.reduce((sum, r) => sum + r.score, 0) / roundScores.length
              );
              
              if (gameAverage > bestGameAverage) {
                bestGameAverage = gameAverage;
              }
              
              // Add scores to the history with proper dates
              roundScores.forEach((r, index) => {
                const roundDate = new Date(gameDate);
                roundDate.setMinutes(roundDate.getMinutes() + (index * 5)); // Approximate round times
                allScores.push({
                  date: roundDate,
                  score: r.score
                });
              });
            }
          }
        });

        // Sort scores by date
        allScores.sort((a, b) => a.date.getTime() - b.date.getTime());

        // Calculate overall stats
        const periodScores = allScores.map(s => s.score);
        const periodAverageScore = periodScores.length > 0
          ? Math.round(periodScores.reduce((a, b) => a + b, 0) / periodScores.length)
          : 0;
        const periodPersonalBest = periodScores.length > 0
          ? Math.max(...periodScores)
          : 0;

        // Convert to the expected format with relative scores
        const scoreHistory = allScores.map(entry => ({
          date: entry.date,
          score: entry.score,
          relativeScore: entry.score - bestGameAverage
        }));

        // Calculate running average
        let runningTotal = 0;
        const averageScoreHistory = scoreHistory.map((entry, index) => {
          runningTotal += entry.score;
          return {
            date: entry.date,
            average: Math.round(runningTotal / (index + 1))
          };
        });

        setFilteredStats({
          gamesPlayed,
          averageScore: periodAverageScore,
          personalBest: periodPersonalBest,
          bestAverage: bestGameAverage,
          scoreHistory,
          averageScoreHistory
        });

        // Calculate gate stats for AI coach
        const games = gamesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        const calculatedGateStats = calculateGateStats(games);
        console.log('Calculated gate stats:', calculatedGateStats);
        setGateStats(calculatedGateStats);

      } catch (error) {
        console.error('Error fetching filtered game data:', error);
        // Fall back to simple filtering if fetch fails
        const filteredScoreHistory = stats.scoreHistory.filter(score => score.date >= cutoffDate);
        setFilteredStats({
          gamesPlayed: Math.ceil(filteredScoreHistory.length / 5),
          averageScore: filteredScoreHistory.length > 0
            ? Math.round(filteredScoreHistory.reduce((sum, s) => sum + s.score, 0) / filteredScoreHistory.length)
            : 0,
          personalBest: filteredScoreHistory.length > 0
            ? Math.max(...filteredScoreHistory.map(s => s.score))
            : 0,
          bestAverage: 0,
          scoreHistory: filteredScoreHistory,
          averageScoreHistory: []
        });
      }

      setCurrentPage(1);
    };

    if (timePeriod !== 'all') {
      fetchFilteredGameData();
    }
  }, [stats, timePeriod, id]);

  useEffect(() => {
    const checkPrivacyAndFetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // Check if viewing own profile
        const isOwnProfile = user?.uid === id;

        // Fetch privacy settings for the profile being viewed
        let profileIsPrivate = false;
        let profilePrivacyLevel: 'public' | 'friends' | 'private' = 'public';
        try {
          const profileSettings = await UserSettingsService.getUserSettings(id as string);
          profilePrivacyLevel = profileSettings?.privacy || 'public';
          profileIsPrivate = profilePrivacyLevel !== 'public';
          console.log(`Privacy settings for user ${id}:`, profileSettings);
        } catch (error) {
          console.error('Error fetching privacy settings:', error);
          // Default to public if we can't fetch settings
          profileIsPrivate = false;
          profilePrivacyLevel = 'public';
        }
        setIsPrivate(profileIsPrivate);
        setProfilePrivacyLevel(profilePrivacyLevel);

        // Check if can view profile
        let canView = true;
        if (profileIsPrivate && !isOwnProfile) {
          if (profilePrivacyLevel === 'private') {
            // Full private - only the owner can view
            canView = false;
            console.log('Profile is fully private, only owner can view');
          } else if (profilePrivacyLevel === 'friends') {
            // Friends only - check if they are friends
            if (user?.uid) {
              const areFriends = await FriendsService.checkIfFriends(user.uid, id as string);
              canView = areFriends;
              console.log(`User ${user.uid} is friends with ${id}:`, areFriends);
            } else {
              // Not logged in, can't view friends-only profiles
              canView = false;
              console.log('User not logged in, cannot view friends-only profile');
            }
          }
        }
        setCanViewProfile(canView);
        console.log(`Can view profile ${id}:`, canView);

        // If can't view, don't fetch data
        if (!canView) {
          setLoading(false);
          return;
        }

        // Original data fetching logic
        // Fetch player data from users collection to get verified status
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/config');
        
        const userDoc = await getDoc(doc(db, 'users', id as string));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsVerified(userData.verified || false);
        }

        // Fetch player data
        const leaderboardData = await LeaderboardService.getAllPlayers();
        
        const playerData = leaderboardData.find(player => player.playerId === id);

        if (!playerData) {
          setPlayerName(t.games.newPlayer);
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
          const scoreDate = new Date(score.timestamp);
          return {
            date: scoreDate,
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
        setError(err instanceof Error ? err.message : t.statistics.failedToLoad);
        console.error('Error loading player statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    checkPrivacyAndFetchData();
  }, [id, user?.uid, t.statistics.failedToLoad, t.games.newPlayer]);

  // Fetch gate stats for 'all' time period
  useEffect(() => {
    const fetchAllTimeGateStats = async () => {
      if (timePeriod !== 'all' || !id) return;
      
      try {
        const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/config');
        
        const gamesQuery = query(
          collection(db, 'games'),
          where('playerIds', 'array-contains', id),
          where('isClosed', '==', true),
          orderBy('createdAt', 'desc')
        );
        
        const gamesSnapshot = await getDocs(gamesQuery);
        
        if (!gamesSnapshot.empty) {
          const games = gamesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          const calculatedGateStats = calculateGateStats(games);
          console.log('Calculated gate stats for all time:', calculatedGateStats);
          setGateStats(calculatedGateStats);
        }
      } catch (error) {
        console.error('Error fetching all time gate stats:', error);
        setGateStats(null);
      }
    };
    
    fetchAllTimeGateStats();
  }, [timePeriod, id]);

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
          text: t.games.date
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

  const rarityColors = {
    common: 'from-gray-100 to-gray-50 text-gray-600 border-gray-200',
    rare: 'from-blue-100 to-blue-50 text-blue-600 border-blue-200',
    epic: 'from-purple-100 to-purple-50 text-purple-600 border-purple-200',
    legendary: 'from-amber-100 to-amber-50 text-amber-600 border-amber-200'
  };

  // Calculate gate stats from the filtered game data
  const calculateGateStats = (games: any[]) => {
    const gateOrder = [2, 3, 4, 1]; // Sjoelen gate order
    const gateData: number[][] = [[], [], [], []]; // 4 gates
    
    games.forEach((game) => {
      const playerScore = game.scores[id as string];
      if (!playerScore?.roundDetails) {
        return;
      }
      
      // Process each round
      Object.entries(playerScore.roundDetails).forEach(([roundNum, gateString]) => {
        // Parse gate string - handle both formats: "7797" and "11.7.9.7"
        let gateScores: number[];
        if (typeof gateString === 'string' && gateString.includes('.')) {
          // Dot-delimited format for double digits
          gateScores = gateString.split('.').map(s => parseInt(s) || 0);
        } else if (typeof gateString === 'string') {
          // Single digit format
          gateScores = gateString.split('').map(s => parseInt(s) || 0);
        } else {
          gateScores = [0, 0, 0, 0];
        }
        
        // Ensure we have exactly 4 values
        while (gateScores.length < 4) {
          gateScores.push(0);
        }
        
        // Add scores to gate data (in order 2,3,4,1)
        for (let i = 0; i < 4; i++) {
          gateData[i].push(gateScores[i] || 0);
        }
      });
    });

    // Calculate statistics for each gate
    const gateStats: any = {};
    
    gateOrder.forEach((gateNumber, index) => {
      const data = gateData[index];
      const average = data.length > 0 ? data.reduce((sum, val) => sum + val, 0) / data.length : 0;
      
      // Calculate trend (compare last 5 vs previous 5)
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (data.length >= 10) {
        const recent = data.slice(-5).reduce((a, b) => a + b, 0) / 5;
        const previous = data.slice(-10, -5).reduce((a, b) => a + b, 0) / 5;
        if (recent > previous * 1.1) trend = 'improving';
        else if (recent < previous * 0.9) trend = 'declining';
      }
      
      gateStats[`gate${gateNumber}`] = {
        average: Math.round(average * 10) / 10,
        recent: data.slice(-10), // Last 10 values
        trend
      };
    });
    
    return gateStats;
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

  // Private profile overlay - check this BEFORE error state
  if (!canViewProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-6 sm:py-12 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Blurred background preview */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="filter blur-xl opacity-50">
              {/* Player Header Preview */}
              <div className="text-center mt-12">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gray-300 animate-pulse" />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="h-8 w-48 bg-gray-300 rounded animate-pulse" />
                </div>
                <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:justify-center gap-2 sm:gap-4">
                  <div className="h-4 w-32 bg-gray-300 rounded animate-pulse mx-auto" />
                  <div className="h-4 w-32 bg-gray-300 rounded animate-pulse mx-auto" />
                </div>
              </div>

              {/* Stats Preview */}
              <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 mt-8 px-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white/80 border border-gray-200 rounded-xl p-4 sm:p-6 animate-pulse">
                    <div className="h-6 w-20 bg-gray-300 rounded mb-2" />
                    <div className="h-10 w-16 bg-gray-300 rounded" />
                  </div>
                ))}
              </div>

              {/* Chart Preview */}
              <div className="mt-8 px-4 space-y-4">
                <div className="bg-white/80 rounded-lg p-6 border border-gray-200 animate-pulse">
                  <div className="h-6 w-40 bg-gray-300 rounded mb-4" />
                  <div className="h-64 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          </div>

          {/* Lock overlay */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="relative z-10 flex items-center justify-center min-h-[60vh]"
          >
            <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl max-w-md mx-auto">
              <div className="mb-6">
                <LockClosedIcon className="h-16 w-16 sm:h-20 sm:w-20 text-gray-400 mx-auto" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                {t.profile.privateProfile}
              </h2>
              <p className="text-gray-600">
                {profilePrivacyLevel === 'private' ? t.profile.privateProfileMessageFull : t.profile.privateProfileMessage}
              </p>
              {!user && (
                <Link
                  href="/auth/sign-in"
                  className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {t.auth.signIn}
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Only show error if it's not a privacy issue
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
            {error || t.statistics.failedToLoad}
          </h3>
        </div>
      </motion.div>
    );
  }

  // TypeScript type guard - stats is definitely not null after this point
  if (!stats) return null;

  // Use filtered stats if available and not showing all time, otherwise use original stats
  const displayStats = (timePeriod !== 'all' && filteredStats) ? filteredStats : stats;

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
          className="space-y-6 sm:space-y-8"
        >
          {/* Player Header - Direct on background */}
          <motion.div variants={fadeIn} className="mb-6 relative">
            {/* Share Button - positioned in top right */}
            <div className="absolute top-0 right-0 z-10">
              <ShareButton 
                title={`${playerName} - ${t.profile.title}`}
                text={`${t.games.averageScore}: ${displayStats.averageScore} pts | ${t.statistics.best}: ${displayStats.personalBest} pts`}
              />
            </div>
            
            <div className="flex flex-col items-center gap-4 py-4">
              {/* Modern Avatar */}
              <div className="relative">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 p-0.5">
                  <div className="h-full w-full rounded-2xl bg-white p-0.5">
                    <div className="h-full w-full rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                      <span className="text-3xl sm:text-4xl font-bold text-primary-600">
                        {playerName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                {isVerified && (
                  <div className="absolute -bottom-1 -right-1">
                    <div className="bg-white rounded-full p-0.5">
                      <VerifiedBadge size="md" />
                    </div>
                  </div>
                )}
              </div>
              
              {/* User Info */}
              <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                  {playerName}
                </h1>
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <ChartBarIcon className="h-4 w-4" />
                    <span className="font-medium">{displayStats.gamesPlayed}</span>
                    <span className="text-gray-500">{t.profile.gamesPlayed}</span>
                  </div>
                  {lastPlayed && (
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <CalendarIcon className="h-4 w-4" />
                      <span className="text-gray-500">{t.profile.lastPlayed}</span>
                      <span className="font-medium">{formatDate(lastPlayed)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Time Period Filter */}
          <motion.div variants={fadeIn} className="flex justify-center">
            <div className="bg-white rounded-xl p-1 inline-flex shadow-sm">
              <button
                onClick={() => setTimePeriod('week')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  timePeriod === 'week'
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {t.statistics.last7Days}
              </button>
              <button
                onClick={() => setTimePeriod('month')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  timePeriod === 'month'
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {t.statistics.last30Days}
              </button>
              <button
                onClick={() => setTimePeriod('year')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  timePeriod === 'year'
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {t.profile.lastYear}
              </button>
              <button
                onClick={() => setTimePeriod('all')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  timePeriod === 'all'
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {t.statistics.allTime}
              </button>
            </div>
          </motion.div>

          {/* Stats Overview */}
          <motion.div variants={fadeIn} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {/* Average Score */}
            <div className="bg-white rounded-xl p-4 border border-gray-200/50 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <ChartBarIcon className="h-4 w-4 text-blue-500" />
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">AVG</span>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 mb-1">{t.games.average}</p>
                <p className="text-2xl font-semibold text-gray-900">{displayStats.averageScore}</p>
              </div>
            </div>

            {/* Best Average */}
            <div className="bg-white rounded-xl p-4 border border-gray-200/50 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-emerald-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 mb-1">{t.profile.bestAvg}</p>
                <p className="text-2xl font-semibold text-gray-900">{displayStats.bestAverage}</p>
              </div>
            </div>

            {/* Personal Best */}
            <div className="bg-white rounded-xl p-4 border border-gray-200/50 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <TrophyIcon className="h-4 w-4 text-amber-500" />
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">TOP</span>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 mb-1">{t.profile.best}</p>
                <p className="text-2xl font-semibold text-gray-900">{displayStats.personalBest}</p>
              </div>
            </div>

            {/* Games Played */}
            <div className="bg-white rounded-xl p-4 border border-gray-200/50 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-purple-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 mb-1">{t.profile.games}</p>
                <p className="text-2xl font-semibold text-gray-900">{displayStats.gamesPlayed}</p>
              </div>
            </div>
          </motion.div>

          {/* Charts */}
          <motion.div variants={fadeIn} className="space-y-6">
            {/* Performance Indicator */}
            {displayStats.scoreHistory.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200/50 overflow-hidden">
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{t.profile.recentPerformance}</h3>
                      <p className="text-sm text-gray-500 mt-2">
                        {(() => {
                          const recentScores = displayStats.scoreHistory.slice(-5);
                          const avgRecent = Math.round(recentScores.reduce((sum, s) => sum + s.score, 0) / recentScores.length);
                          const diff = avgRecent - displayStats.averageScore;
                          return (
                            <>
                              {t.profile.lastGames.replace('{count}', '5')}: <span className="font-semibold">{avgRecent}</span>
                              {diff !== 0 && (
                                <span className={`ml-1 font-medium ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ({diff > 0 ? '+' : ''}{diff})
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {(() => {
                        const recentScores = displayStats.scoreHistory.slice(-5);
                        const avgRecent = Math.round(recentScores.reduce((sum, s) => sum + s.score, 0) / recentScores.length);
                        const diff = avgRecent - displayStats.averageScore;
                        return (
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            diff > 0 ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-sm' : 
                            diff < 0 ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-sm' : 
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {diff > 0 ? (
                              <>
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                {t.profile.improving}
                              </>
                            ) : diff < 0 ? (
                              <>
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                </svg>
                                {t.profile.declining}
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                                </svg>
                                {t.profile.stable}
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Score History Chart */}
            <div className="bg-white rounded-2xl border border-gray-200/50 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{t.profile.scoreHistory}</h3>
                    <p className="text-sm text-gray-500 mt-1">{t.profile.individualScoresOverTime}</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-gray-600">Live</span>
                  </div>
                </div>
                <div className="h-[250px] sm:h-[300px] lg:h-[400px]">
                  <Line
                    data={{
                      datasets: [
                        {
                          label: t.games.score,
                          data: displayStats.scoreHistory.map((entry, index) => ({
                            x: index,
                            y: entry.score,
                            date: entry.date
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
                          type: 'linear',
                          ticks: {
                            callback: function(value: any) {
                              const index = Math.floor(value);
                              if (index !== value || index < 0 || index >= displayStats.scoreHistory.length) return '';
                              
                              // Show every nth label to avoid crowding
                              const totalPoints = displayStats.scoreHistory.length;
                              let showEvery = 1;
                              if (totalPoints > 50) showEvery = 10;
                              else if (totalPoints > 20) showEvery = 5;
                              else if (totalPoints > 10) showEvery = 2;
                              
                              if (index % showEvery !== 0 && index !== 0 && index !== totalPoints - 1) return '';
                              
                              return `${t.profile.game} ${index + 1}`;
                            },
                            maxRotation: 45,
                            minRotation: 45
                          },
                          title: {
                            display: true,
                            text: t.profile.gameNumber
                          },
                          grid: {
                            display: true
                          }
                        },
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: t.games.score
                          }
                        }
                      },
                      plugins: {
                        ...chartOptions.plugins,
                        tooltip: {
                          ...chartOptions.plugins.tooltip,
                          callbacks: {
                            title: (context: any) => {
                              const point = context[0];
                              if (!point) return '';
                              const index = point.parsed.x;
                              const dateData = point.raw.date;
                              return [
                                `${t.profile.game} ${index + 1}`,
                                dateData ? formatDate(dateData) : ''
                              ];
                            },
                            label: (context: any) => {
                              return `${t.games.score}: ${context.parsed.y}`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Relative Score Chart */}
            <div className="bg-white rounded-2xl border border-gray-200/50 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
                  <h3 className="text-xl font-bold text-gray-900">{t.profile.pointsVsBestAverage}</h3>
                  <div className="flex items-center text-xs sm:text-sm text-gray-500">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    {t.profile.relativeTo100Points.replace('{points}', displayStats.bestAverage.toString())}
                  </div>
                </div>
                <div className="h-[250px] sm:h-[300px] lg:h-[400px]">
                  <Line
                    data={{
                      datasets: [
                        {
                          label: t.profile.pointsVsBestAverage,
                          data: displayStats.scoreHistory.map((entry, index) => ({
                            x: index,
                            y: entry.relativeScore,
                            date: entry.date
                          })),
                          borderColor: 'rgb(59, 130, 246)',
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
                          type: 'linear',
                          ticks: {
                            callback: function(value: any) {
                              const index = Math.floor(value);
                              if (index !== value || index < 0 || index >= displayStats.scoreHistory.length) return '';
                              
                              // Show every nth label to avoid crowding
                              const totalPoints = displayStats.scoreHistory.length;
                              let showEvery = 1;
                              if (totalPoints > 50) showEvery = 10;
                              else if (totalPoints > 20) showEvery = 5;
                              else if (totalPoints > 10) showEvery = 2;
                              
                              if (index % showEvery !== 0 && index !== 0 && index !== totalPoints - 1) return '';
                              
                              return `${t.profile.game} ${index + 1}`;
                            },
                            maxRotation: 45,
                            minRotation: 45
                          },
                          title: {
                            display: true,
                            text: t.profile.gameNumber
                          },
                          grid: {
                            display: true
                          }
                        },
                        y: {
                          beginAtZero: false,
                          title: {
                            display: true,
                            text: `${t.profile.pointsVsBestAverage.replace('{points}', displayStats.bestAverage.toString())}`
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
                            title: (context: any) => {
                              const point = context[0];
                              if (!point) return '';
                              const index = point.parsed.x;
                              const dateData = point.raw.date;
                              return [
                                `${t.profile.game} ${index + 1}`,
                                dateData ? formatDate(dateData) : ''
                              ];
                            },
                            label: (context: any) => {
                              const relativeScore = context.parsed.y;
                              const actualScore = relativeScore + displayStats.bestAverage;
                              return `${t.games.score}: ${relativeScore >= 0 ? '+' : ''}${relativeScore} (${actualScore} vs ${displayStats.bestAverage})`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Gate Performance Chart */}
            <GatePerformanceChart playerId={id as string} timePeriod={timePeriod} />

            {/* Score History Table */}
            <div className="bg-white rounded-2xl border border-gray-200/50 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
                  <h3 className="text-xl font-bold text-gray-900">{t.games.roundHistory}</h3>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {displayStats.scoreHistory.length} {t.games.total.toLowerCase()} {t.games.rounds.toLowerCase()}
                  </span>
                </div>
                
                {displayStats.scoreHistory.length > 0 ? (
                  <>
                    {/* Mobile-friendly card view on small screens */}
                    <div className="md:hidden space-y-3">
                      {displayStats.scoreHistory
                        .slice()
                        .reverse()
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((entry, index) => (
                        <div key={index} className="bg-gray-50/50 rounded-xl p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{entry.date.toLocaleDateString()}</p>
                              <p className="text-xs text-gray-500">{entry.date.toLocaleTimeString()}</p>
                            </div>
                            <span
                              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                entry.relativeScore >= 0
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {entry.relativeScore >= 0 ? '+' : ''}{entry.relativeScore}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200/50">
                            <span className="text-xs text-gray-500">{t.games.score}</span>
                            <span className="text-lg font-semibold text-gray-900">{entry.score}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop table view */}
                    <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-100">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gray-50/50">
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t.games.date}</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t.games.score}</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">vs {t.profile.best}</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {displayStats.scoreHistory
                            .slice()
                            .reverse()
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((entry, index) => (
                            <tr key={index} className="hover:bg-gray-50/50 transition-all duration-200 border-t border-gray-100/50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="font-medium">{entry.date.toLocaleDateString()}</span>
                                  <span className="text-xs text-gray-400">{entry.date.toLocaleTimeString()}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-semibold text-gray-900">{entry.score}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span
                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                                      entry.relativeScore >= 0
                                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200/50'
                                        : 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border border-red-200/50'
                                    }`}
                                    title={`${entry.score} - ${displayStats.bestAverage} = ${entry.relativeScore}`}
                                  >
                                    {entry.relativeScore >= 0 ? (
                                      <>
                                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                        </svg>
                                        +{entry.relativeScore}
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                        {entry.relativeScore}
                                      </>
                                    )}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {displayStats.scoreHistory.length > itemsPerPage && (
                      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between">
                        <div className="text-sm text-gray-500 mb-4 sm:mb-0">
                          {t.common.showing}{' '}
                          <span className="font-medium">
                            {Math.min((currentPage - 1) * itemsPerPage + 1, displayStats.scoreHistory.length)}
                          </span>{' '}
                          {t.common.to}{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * itemsPerPage, displayStats.scoreHistory.length)}
                          </span>{' '}
                          {t.common.of}{' '}
                          <span className="font-medium">{displayStats.scoreHistory.length}</span> {t.games.rounds.toLowerCase()}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className={`p-2 rounded-xl transition-all duration-200 ${
                              currentPage === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200/50'
                            }`}
                          >
                            <ChevronLeftIcon className="h-5 w-5" />
                          </button>
                          
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.ceil(displayStats.scoreHistory.length / itemsPerPage) }, (_, i) => i + 1)
                              .filter(page => {
                                const totalPages = Math.ceil(displayStats.scoreHistory.length / itemsPerPage);
                                if (totalPages <= 7) return true;
                                if (page === 1 || page === totalPages) return true;
                                if (Math.abs(page - currentPage) <= 1) return true;
                                if (currentPage <= 3 && page <= 5) return true;
                                if (currentPage >= totalPages - 2 && page >= totalPages - 4) return true;
                                return false;
                              })
                              .map((page, index, array) => (
                                <div key={page} className="flex items-center">
                                  {index > 0 && array[index - 1] !== page - 1 && (
                                    <span className="px-2 text-gray-400">...</span>
                                  )}
                                  <button
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                      currentPage === page
                                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                                        : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                  >
                                    {page}
                                  </button>
                                </div>
                              ))}
                          </div>
                          
                          <button
                            onClick={() => setCurrentPage(Math.min(Math.ceil(displayStats.scoreHistory.length / itemsPerPage), currentPage + 1))}
                            disabled={currentPage === Math.ceil(displayStats.scoreHistory.length / itemsPerPage)}
                            className={`p-2 rounded-xl transition-all duration-200 ${
                              currentPage === Math.ceil(displayStats.scoreHistory.length / itemsPerPage)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200/50'
                            }`}
                          >
                            <ChevronRightIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>{t.statistics.noDataYet}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Average Score Trend */}
            <div className="bg-white rounded-2xl border border-gray-200/50 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
                  <h3 className="text-xl font-bold text-gray-900">{t.statistics.progressOverTime}</h3>
                  <div className="flex items-center text-xs sm:text-sm text-gray-500">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    {t.games.runningAverageOverTime}
                  </div>
                </div>
                <div className="h-[250px] sm:h-[300px] lg:h-[400px]">
                  <Line
                    data={{
                      datasets: [
                        {
                          label: t.games.averageScore,
                          data: displayStats.averageScoreHistory.map((entry, index) => ({
                            x: index,
                            y: entry.average,
                            date: entry.date
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
                          type: 'linear',
                          ticks: {
                            callback: function(value: any) {
                              const index = Math.floor(value);
                              if (index !== value || index < 0 || index >= displayStats.averageScoreHistory.length) return '';
                              
                              // Show every nth label to avoid crowding
                              const totalPoints = displayStats.averageScoreHistory.length;
                              let showEvery = 1;
                              if (totalPoints > 50) showEvery = 10;
                              else if (totalPoints > 20) showEvery = 5;
                              else if (totalPoints > 10) showEvery = 2;
                              
                              if (index % showEvery !== 0 && index !== 0 && index !== totalPoints - 1) return '';
                              
                              return `${t.profile.game} ${index + 1}`;
                            },
                            maxRotation: 45,
                            minRotation: 45
                          },
                          title: {
                            display: true,
                            text: t.profile.gameNumber
                          },
                          grid: {
                            display: true
                          }
                        },
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: t.games.averageScore
                          }
                        }
                      },
                      plugins: {
                        ...chartOptions.plugins,
                        tooltip: {
                          ...chartOptions.plugins.tooltip,
                          callbacks: {
                            title: (context: any) => {
                              const point = context[0];
                              if (!point) return '';
                              const index = point.parsed.x;
                              const dateData = point.raw.date;
                              return [
                                t.games.afterGame.replace('{number}', (index + 1).toString()),
                                dateData ? formatDate(dateData) : ''
                              ];
                            },
                            label: (context: any) => {
                              return `${t.games.average}: ${context.parsed.y}`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* AI Profile Coach - show only if user can view profile and AI Coach is enabled */}
      {canViewProfile && aiCoachEnabled && stats && (
        <AIProfileCoach 
          playerName={playerName}
          stats={{
            ...(filteredStats || stats),
            lastPlayed,
            timePeriod,
            gateStats
          }}
        />
      )}
    </div>
  );
} 