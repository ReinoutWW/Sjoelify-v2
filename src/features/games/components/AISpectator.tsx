'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatBubbleBottomCenterTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/lib/context/auth-context';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { Game } from '@/features/games/types';
import { UserProfile } from '@/features/account/types';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/vertexai';
import app from '@/lib/firebase/config';
import { UserSettingsService } from '@/features/account/services/user-settings-service';
import { AccountSettings } from '@/features/account/types';

interface AISpectatorProps {
  game: Game;
  currentRound: number;
  players: (UserProfile | { id: string; displayName: string; isGuest: true })[];
  onClose?: () => void;
}

interface GameStats {
  canStillWin: { [playerId: string]: boolean };
  leadMargin: number;
  playerFacts: {
    [playerId: string]: {
      closeToAverage: boolean;
      averageDiff: number;
      possibleHighScore: boolean;
      currentPace: number;
      bestAverage?: number;
      consistency: number;
      momentum: 'improving' | 'declining' | 'stable';
      gatePreference?: string;
      streakInfo?: string;
      roundComparison?: string;
      perfectRoundPotential?: boolean;
      closeToPersonalBest?: boolean;
      gateEfficiency?: number;
      position: number;
      pointsBehindLeader: number;
      pointsNeededToWin?: number;
      lastRoundScore?: number;
      bestRoundScore?: number;
      worstRoundScore?: number;
    };
  };
  tightRace: boolean;
  anyComeback: boolean;
  roundHighlights: string[];
  dramaticMoment?: string;
  interestingFact?: string;
  leaderName: string;
  totalPlayers: number;
}

export function AISpectator({ game, currentRound, players, onClose }: AISpectatorProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isCompletelyMinimized, setIsCompletelyMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const [userSettings, setUserSettings] = useState<AccountSettings | null>(null);
  const previousRoundRef = useRef<number>(currentRound);
  const [gameMetrics, setGameMetrics] = useState<{
    position: number;
    totalPlayers: number;
    pointsBehind: number;
    pointsToNewBest: number | null;
    isOnTrackForBest: boolean;
    projectedAverage: number;
    currentAverage: number;
    bestAverage?: number;
    averageNeededForBest?: number | null;
  } | null>(null);

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      if (user?.uid) {
        try {
          const settings = await UserSettingsService.getUserSettings(user.uid);
          setUserSettings(settings);
        } catch (error) {
          console.error('Error loading user settings:', error);
        }
      }
    };
    loadSettings();
  }, [user?.uid]);

  useEffect(() => {
    // Detect round changes
    if (previousRoundRef.current !== currentRound) {
      // Close the spectator when round changes
      setIsOpen(false);
      setIsCompletelyMinimized(false);
      setMessage('');
      
      // After a brief delay, open for the new round
      setTimeout(() => {
        if (currentRound >= 2 && currentRound <= 5 && user) {
          setIsOpen(true);
          setIsCompletelyMinimized(false);
          generateSpectatorMessage();
        }
      }, 500); // Small delay to ensure smooth transition
      
      previousRoundRef.current = currentRound;
    }
    
    // Special handling for round 3 - always open even if manually closed
    if (currentRound === 3 && !isOpen && user) {
      setTimeout(() => {
        setIsOpen(true);
        setIsCompletelyMinimized(false);
        generateSpectatorMessage();
      }, 1000);
    }
  }, [currentRound, user]);
  
  // Regenerate message if coach preference changes while spectator is open
  useEffect(() => {
    if (isOpen && !isCompletelyMinimized && userSettings) {
      generateSpectatorMessage();
    }
  }, [userSettings?.coachPreference]);

  const gatherGameStats = (): GameStats => {
    const playerScores = players.map(player => {
      const playerScore = game.scores[player.id];
      const totalScore = playerScore ? playerScore.total : 0;
      return { 
        playerId: player.id, 
        totalScore,
        displayName: player.displayName 
      };
    });

    playerScores.sort((a, b) => b.totalScore - a.totalScore);
    const leader = playerScores[0];
    const leadMargin = leader.totalScore - (playerScores[1]?.totalScore || 0);

    // Calculate if players can still win
    const remainingRounds = 5 - currentRound + 1;
    const maxPossiblePerRound = 148; // Theoretical max
    const realisticMaxPerRound = 120; // More realistic max

    const canStillWin: { [playerId: string]: boolean } = {};
    playerScores.forEach((player, idx) => {
      if (idx === 0) {
        canStillWin[player.playerId] = true;
      } else {
        const deficit = leader.totalScore - player.totalScore;
        canStillWin[player.playerId] = deficit < (remainingRounds * realisticMaxPerRound * 0.5);
      }
    });

    // Gather player-specific facts
    const playerFacts: GameStats['playerFacts'] = {};
    
    players.forEach((player, idx) => {
      const playerScore = game.scores[player.id];
      const position = playerScores.findIndex(p => p.playerId === player.id) + 1;
      const pointsBehindLeader = leader.totalScore - (playerScore?.total || 0);
      
      if (!playerScore) {
        playerFacts[player.id] = {
          closeToAverage: false,
          averageDiff: 0,
          possibleHighScore: false,
          currentPace: 0,
          consistency: 0,
          momentum: 'stable',
          streakInfo: 'normal',
          position,
          pointsBehindLeader,
          pointsNeededToWin: undefined,
          lastRoundScore: undefined,
          bestRoundScore: undefined,
          worstRoundScore: undefined
        };
        return;
      }

      const rounds = Object.values(playerScore.rounds);
      const avgScore = rounds.length > 0 
        ? rounds.reduce((sum: number, score: number) => sum + score, 0) / rounds.length 
        : 0;

      // Calculate consistency (standard deviation)
      const mean = rounds.length > 0 ? rounds.reduce((a: number, b: number) => a + b, 0) / rounds.length : 0;
      const variance = rounds.length > 0 
        ? rounds.reduce((sum: number, score: number) => sum + Math.pow(score - mean, 2), 0) / rounds.length 
        : 0;
      const consistency = Math.sqrt(variance);

      // Calculate momentum
      let momentum: 'improving' | 'declining' | 'stable' = 'stable';
      if (rounds.length >= 2) {
        const recent = rounds.slice(-2);
        if (recent[1] > recent[0] + 10) momentum = 'improving';
        else if (recent[1] < recent[0] - 10) momentum = 'declining';
      }

      // Calculate points needed to win
      const pointsNeededToWin = position === 1 ? 0 : 
        Math.ceil((pointsBehindLeader / remainingRounds) + 1);

      const lastRoundScore = rounds.length > 0 ? rounds[rounds.length - 1] : undefined;
      const bestRoundScore = rounds.length > 0 ? Math.max(...rounds) : undefined;
      const worstRoundScore = rounds.length > 0 ? Math.min(...rounds) : undefined;

      playerFacts[player.id] = {
        closeToAverage: false,
        averageDiff: 0,
        possibleHighScore: avgScore > 100 && remainingRounds >= 1,
        currentPace: Math.round(avgScore),
        consistency: Math.round(consistency),
        momentum,
        streakInfo: rounds.filter((s: number) => s > 100).length >= 2 ? 'hot' : 'normal',
        position,
        pointsBehindLeader,
        pointsNeededToWin,
        lastRoundScore,
        bestRoundScore,
        worstRoundScore,
        perfectRoundPotential: avgScore > 90 && consistency < 20
      };
    });

    // Check for tight race
    const tightRace = playerScores.length > 1 && leadMargin < 20;
    
    // Check for any comeback stories
    const anyComeback = Object.values(canStillWin).filter(can => can).length > 1;

    // Round highlights
    const roundHighlights: string[] = [];
    const lastRoundScores = players.map(p => {
      const score = game.scores[p.id];
      return score?.rounds[currentRound - 1] || 0;
    }).filter(s => s > 0);
    
    if (lastRoundScores.length > 0) {
      const highScore = Math.max(...lastRoundScores);
      if (highScore > 120) roundHighlights.push('exceptional round');
      if (highScore < 50) roundHighlights.push('challenging round');
      
      // Check for dramatic moments
      const avgLastRound = lastRoundScores.reduce((a, b) => a + b, 0) / lastRoundScores.length;
      if (Math.abs(highScore - avgLastRound) > 40) {
        roundHighlights.push('dramatic score differences');
      }
    }

    return {
      canStillWin,
      leadMargin,
      playerFacts,
      tightRace,
      anyComeback,
      roundHighlights,
      leaderName: leader.displayName,
      totalPlayers: players.length
    };
  };

  const generateSpectatorMessage = async () => {
    if (!user || !app) return;

    try {
      setIsStreaming(true);
      const stats = gatherGameStats();
      
      // Find current player
      const currentPlayer = players.find(p => p.id === user.uid);
      if (!currentPlayer) return;

      const currentPlayerStats = stats.playerFacts[currentPlayer.id];
      if (!currentPlayerStats) {
        console.error('No stats found for current player');
        return;
      }
      
      const language = userSettings?.language || 'nl';
      const coachTone = userSettings?.coachPreference || 'supportive';
      
      console.log('AI Spectator - Coach Settings:', {
        language,
        coachTone,
        userSettings
      });

      // Calculate high score tracking
      const currentTotal = game.scores[currentPlayer.id]?.total || 0;
      const remainingRounds = 5 - currentRound + 1;
      const currentAverage = currentPlayerStats.currentPace;
      const projectedFinalScore = currentTotal + (currentAverage * remainingRounds);
      
      // Get player's best average from their game history (if not a guest)
      let bestAverage = 0;
      if (!('isGuest' in currentPlayer)) {
        try {
          // Fetch player's best game score
          const { collection, query, where, getDocs } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase/config');
          
          const gamesQuery = query(
            collection(db, 'games'),
            where('playerIds', 'array-contains', currentPlayer.id),
            where('isClosed', '==', true)
          );
          
          const gamesSnapshot = await getDocs(gamesQuery);
          
          // Find highest average (only from complete 5-round games)
          gamesSnapshot.docs.forEach(doc => {
            const gameData = doc.data();
            const playerScore = gameData.scores?.[currentPlayer.id];
            if (playerScore?.total && playerScore.rounds) {
              // Count rounds
              const roundCount = Object.keys(playerScore.rounds).length;
              if (roundCount === 5) {
                const gameAverage = playerScore.total / 5;
                if (gameAverage > bestAverage) {
                  bestAverage = gameAverage;
                }
              }
            }
          });
        } catch (error) {
          console.error('Error fetching personal best average:', error);
        }
      }
      
      // Calculate average needed per remaining round for new best
      let averageNeededForBest: number | null = null;
      let isOnTrackForBest = false;
      
      if (bestAverage > 0 && remainingRounds > 0) {
        // Total needed for new best = (bestAverage * 5) + 1
        const totalNeededForBest = (bestAverage * 5) + 1;
        const pointsStillNeeded = totalNeededForBest - currentTotal;
        averageNeededForBest = Math.ceil(pointsStillNeeded / remainingRounds);
        
        // Check if on track (current average is meeting or exceeding needed average)
        isOnTrackForBest = currentAverage >= averageNeededForBest;
      }

      // Update game metrics for badges
      setGameMetrics({
        position: currentPlayerStats.position,
        totalPlayers: stats.totalPlayers,
        pointsBehind: currentPlayerStats.pointsBehindLeader,
        pointsToNewBest: null, // We'll use averageNeededForBest instead
        isOnTrackForBest: isOnTrackForBest,
        projectedAverage: projectedFinalScore / 5,
        currentAverage: currentAverage,
        bestAverage: bestAverage,
        averageNeededForBest: averageNeededForBest
      });

      const ai = getAI(app, { backend: new GoogleAIBackend() });
      const model = getGenerativeModel(ai, { 
        model: "gemini-2.5-flash-preview-05-20",
        generationConfig: {
          temperature: coachTone === 'supportive' ? 0.9 : coachTone === 'balanced' ? 0.75 : 0.5,
          maxOutputTokens: 250,
        }
      });

      // Coach tone descriptions - More explicit and different
      const toneInstructions = {
        'supportive': 'Be EXTREMELY positive and encouraging. Use exclamation marks! Focus only on the good. Example: "Great job! You\'re doing amazing!"',
        'balanced': 'Give HONEST feedback with STRATEGIC advice. Mix acknowledgment with improvement tips. Example: "Good 85 points, but you need 95+ to catch up. Focus on gate 3!"',
        'super-competitive': 'Be HARSH and DIRECT. Focus on what\'s wrong. Be critical. Example: "That wasn\'t good enough. You\'re falling behind and need to step up NOW."'
      };
      
      // Round-specific context
      const roundContext = {
        2: 'This is early game - set the tone and establish your rhythm.',
        3: 'Mid-game now - this is where games are won or lost!',
        4: 'Crucial round 4 - time to make your move!',
        5: 'FINAL ROUND - give it everything you\'ve got!'
      };

      const prompt = `You are "Sjef Sjoelbaas", a sjoelen coach with ${coachTone === 'super-competitive' ? 'HARSH' : coachTone === 'balanced' ? 'BALANCED' : 'SUPPORTIVE'} personality.
Round ${currentRound} of 5 just started. ${roundContext[currentRound as keyof typeof roundContext]}
IMPORTANT: Respond in ${language === 'en' ? 'English' : 'Dutch'} language.
CRITICAL: Your tone MUST be ${coachTone === 'super-competitive' ? 'HARSH, CRITICAL and DEMANDING' : coachTone === 'balanced' ? 'BALANCED and STRATEGIC' : 'SUPER POSITIVE and ENCOURAGING'}
${toneInstructions[coachTone]}
Maximum 2 sentences. Include specific numbers!

CURRENT SITUATION:
- ${currentPlayer.displayName}'s position: ${currentPlayerStats.position} vs the total of ${stats.totalPlayers} players
- ${currentPlayerStats.position === 1 ? 
    `Leading by ${stats.leadMargin} points!` : 
    `${currentPlayerStats.pointsBehindLeader} points behind ${stats.leaderName}`}
- Average per round: ${currentPlayerStats.currentPace} points
- Last round: ${currentPlayerStats.lastRoundScore !== undefined ? `${currentPlayerStats.lastRoundScore} points` : 'N/A'}
- Momentum: ${currentPlayerStats.momentum}
- ${stats.canStillWin[currentPlayer.id] ? 
    `Can still win! Need avg ${currentPlayerStats.pointsNeededToWin} points/round` : 
    'Victory is tough but not impossible!'}
${currentRound === 5 ? '- THIS IS THE FINAL ROUND!' : ''}
${currentRound === 2 ? '- First round done, setting the pace' : ''}

HIGH SCORE TRACKING:
${bestAverage > 0 ? (
  isOnTrackForBest ? 
    `- ON TRACK FOR NEW PERSONAL BEST AVERAGE! Current avg: ${currentAverage}, best avg: ${Math.floor(bestAverage)}` :
    `- Personal best avg: ${Math.floor(bestAverage)}. Need ${averageNeededForBest} avg per remaining round for new record!`
) : '- First tracked game - set your benchmark!'}

${coachTone === 'super-competitive' ? 
  'BE CRITICAL! Point out failures. Demand better. No compliments unless truly exceptional (130+ score).' :
  coachTone === 'balanced' ?
  'Give HONEST feedback with STRATEGIC advice. Mix acknowledgment with improvement tips.' :
  'BE SUPER POSITIVE! Everything is great! They are doing amazing!'}

End with emoji: ${coachTone === 'super-competitive' ? '😤 or 😡' : coachTone === 'balanced' ? '💪 or 🤏' : '🌟 or 🎉'}`;

      let text = '';
      
      try {
        // Try with the thinking model first
        const result = await model.generateContent(prompt);
        const response = result.response;
        text = response.text();
      } catch (modelError) {
        console.warn('Thinking model failed, trying fallback model:', modelError);
        
        // Fallback to standard model
        const fallbackModel = getGenerativeModel(ai, { 
          model: "gemini-1.5-flash",
          generationConfig: {
            temperature: coachTone === 'supportive' ? 0.9 : coachTone === 'balanced' ? 0.75 : 0.5,
            maxOutputTokens: 250,
          }
        });
        
        try {
          const result = await fallbackModel.generateContent(prompt);
          const response = result.response;
          text = response.text();
        } catch (fallbackError) {
          console.error('Both models failed:', fallbackError);
          throw fallbackError;
        }
      }
      
      // Simulate streaming effect
      setMessage('');
      const words = text.split(' ');
      
      for (let i = 0; i < words.length; i++) {
        setMessage(prev => prev + (i > 0 ? ' ' : '') + words[i]);
        
        // Scroll to bottom as text appears
        if (messageRef.current) {
          messageRef.current.scrollTop = messageRef.current.scrollHeight;
        }
        
        // Add slight delay for streaming effect
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error('Error generating spectator message:', error);
      const fallbackMessages = {
        nl: "Kom op! Ronde 4 is waar kampioenen worden gemaakt! 🎯",
        en: "Let's go! Round 4 is where champions are made! 🎯"
      };
      setMessage(fallbackMessages[userSettings?.language || 'nl']);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleClose = () => {
    setIsCompletelyMinimized(true);
  };
  
  const handleReopen = () => {
    setIsCompletelyMinimized(false);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isOpen && !isCompletelyMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1
            }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 sm:w-full sm:max-w-sm"
          >
            <div className="bg-white rounded-xl shadow-xl sm:shadow-lg border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="relative">
                    <ChatBubbleBottomCenterTextIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    <motion.div
                      className="absolute -top-1 -right-1"
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    >
                      <SparklesIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-500" />
                    </motion.div>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-900">Sjef Sjoelbaas</span>
                  {isStreaming && (
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="text-xs text-blue-600 hidden sm:inline"
                    >
                      • Live
                    </motion.span>
                  )}
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 sm:p-2 -mr-0.5 sm:-mr-1 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
                  aria-label="Close"
                >
                  <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                </button>
              </div>

              {/* Message Content */}
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div 
                  ref={messageRef}
                  className="p-3 sm:p-4 text-gray-700 text-sm sm:text-base leading-relaxed max-h-32 sm:max-h-40 overflow-y-auto"
                >
                  {message || (
                    <div className="flex items-center gap-2 justify-center py-2">
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                      </motion.div>
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                      >
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                      </motion.div>
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                      >
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                      </motion.div>
                    </div>
                  )}
                </div>
                
                {/* Metrics Badges - Mobile optimized */}
                {gameMetrics && message && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="px-3 pt-2 sm:px-4 pb-2.5 sm:pb-3 pt-0 border-t border-gray-100"
                  >
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                      {/* Position Badge */}
                      <div className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                        gameMetrics.position === 1 
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        <span className="text-xs sm:text-sm">{gameMetrics.position === 1 ? '👑' : '🎯'}</span>
                        <span className="ml-0.5 sm:ml-1 text-xs">#{gameMetrics.position}/{gameMetrics.totalPlayers}</span>
                      </div>
                      
                      {/* Points Behind/Ahead Badge */}
                      {gameMetrics.position !== 1 && (
                        <div className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200 whitespace-nowrap flex-shrink-0">
                          <span className="text-xs sm:text-sm">📊</span>
                          <span className="ml-0.5 sm:ml-1 text-xs">-{gameMetrics.pointsBehind}</span>
                        </div>
                      )}
                      
                      {/* Personal Best Badge */}
                      {gameMetrics.averageNeededForBest !== null && gameMetrics.averageNeededForBest !== undefined && (
                        <div className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                          gameMetrics.isOnTrackForBest
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}>
                          <span className="text-xs sm:text-sm">{gameMetrics.isOnTrackForBest ? '🚀' : '🎯'}</span>
                          <span className="ml-0.5 sm:ml-1 text-xs">
                            {gameMetrics.isOnTrackForBest 
                              ? `${t.games.onTrack || 'on track'}!`
                              : `${gameMetrics.averageNeededForBest} ${t.games.avgNeeded || 'avg needed'}`
                            }
                          </span>
                        </div>
                      )}
                      
                      {/* Average Badge */}
                      <div className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 whitespace-nowrap flex-shrink-0">
                        <span className="text-xs sm:text-sm">📈</span>
                        <span className="ml-0.5 sm:ml-1 text-xs">avg {gameMetrics.currentAverage}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized Chat Icon */}
      <AnimatePresence>
        {isOpen && isCompletelyMinimized && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReopen}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 sm:p-3.5 rounded-full shadow-lg sm:shadow-xl hover:shadow-xl sm:hover:shadow-2xl active:shadow-lg transition-all touch-manipulation"
            aria-label="Open AI Spectator"
          >
            <div className="relative">
              <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0] 
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2,
                  ease: "easeInOut" 
                }}
              >
                <SparklesIcon className="w-3 h-3 text-yellow-300" />
              </motion.div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
} 