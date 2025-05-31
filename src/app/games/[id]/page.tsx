'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { useDateFormatter } from '@/lib/hooks/useDateFormatter';
import { GameService } from '@/features/games/services/game-service';
import { ScoreEntry } from '@/features/games/components/ScoreEntry';
import { GameSummary } from '@/features/games/components/GameSummary';
import { useGame } from '@/features/games/hooks/use-game';
import { fadeIn } from '@/shared/styles/animations';
import { TrophyIcon, ClockIcon, UserCircleIcon, TrashIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { VerifiedBadge } from '@/shared/components/VerifiedBadge';
import { UserProfile } from '@/features/account/types';
import { GuestPlayer } from '@/features/games/types';
import { InGameStatsPopup } from '@/features/games/components/InGameStatsPopup';
import { AISpectator } from '@/features/games/components/AISpectator';
import { UserSettingsService } from '@/features/account/services/user-settings-service';

// Add helper functions for safe date handling
const toISOStringOrUndefined = (dateString: string | number | Date | undefined | null): string | undefined => {
  if (!dateString) return undefined;
  
  try {
    // Handle Firestore Timestamp
    if (typeof dateString === 'object' && dateString !== null && 'seconds' in dateString && typeof dateString.seconds === 'number') {
      const date = new Date(dateString.seconds * 1000);
      return isNaN(date.getTime()) ? undefined : date.toISOString();
    }
    
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date.toISOString();
  } catch (error) {
    console.error('Error converting date to ISO string:', error);
    return undefined;
  }
};

const formatDate = (dateString: string | number | Date | undefined | null): string => {
  if (!dateString) return 'Recently updated';
  
  try {
    // Handle Firestore Timestamp
    if (typeof dateString === 'object' && dateString !== null && 'seconds' in dateString && typeof dateString.seconds === 'number') {
      const date = new Date(dateString.seconds * 1000);
      if (isNaN(date.getTime())) return 'Recently updated';
      
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently updated';
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Recently updated';
  }
};

export default function GamePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { formatDate } = useDateFormatter();
  const { game, loading, error } = useGame(id as string);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [abandoning, setAbandoning] = useState(false);
  const [reverting, setReverting] = useState<string | null>(null);
  const router = useRouter();
  const [guestName, setGuestName] = useState('');
  const [guestError, setGuestError] = useState<string | null>(null);
  const [addingGuest, setAddingGuest] = useState(false);
  const [statsPopupPlayer, setStatsPopupPlayer] = useState<any>(null);
  const [aiCoachEnabled, setAiCoachEnabled] = useState(false);

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

  const handleRemoveGuest = async (guestId: string) => {
    if (!game || !user) return;
    
    if (!confirm(t.games.removePlayer + '?')) {
      return;
    }
    
    try {
      await GameService.removeGuest(game.id, guestId);
    } catch (err) {
      console.error('Failed to remove guest:', err);
    }
  };

  const handleScoreSubmit = async (scores: number[]) => {
    if (!game || !user) return;
    
    const targetPlayerId = selectedPlayerId || user.uid;
    
    // Check permissions before submitting
    if (!canSubmitForPlayer(targetPlayerId)) {
      console.error('Not authorized to submit scores for this player');
      return;
    }
    
    setSubmitting(true);
    try {
      await GameService.submitRound(game.id, targetPlayerId, game.currentRound, scores);
      // Reset selected player after successful submission
      setSelectedPlayerId(null);
    } catch (err) {
      console.error('Failed to submit scores:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAbandonGame = async () => {
    if (!game || !user) return;
    
    // Only allow game creator to abandon
    if (game.createdBy !== user.uid) return;
    
    if (!confirm('Are you sure you want to abandon this game? This action cannot be undone.')) {
      return;
    }
    
    setAbandoning(true);
    try {
      await GameService.deleteGame(game.id);
      // Redirect to dashboard after successful deletion
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to abandon game:', err);
      alert('Failed to abandon game. Please try again.');
    } finally {
      setAbandoning(false);
    }
  };

  const handleRevertScore = async (playerId: string) => {
    if (!game || !user) return;
    
    // Check if user can revert this score
    if (!canRevertScore(playerId)) {
      console.error('Not authorized to revert this score');
      return;
    }
    
    if (!confirm('Are you sure you want to revert this score? The player will need to resubmit.')) {
      return;
    }
    
    setReverting(playerId);
    try {
      await GameService.revertRoundSubmission(game.id, playerId, game.currentRound);
      // If we reverted our own score or a selected player's score, reset selection
      if (playerId === user.uid || playerId === selectedPlayerId) {
        setSelectedPlayerId(null);
      }
    } catch (err) {
      console.error('Failed to revert score:', err);
      alert('Failed to revert score. Please try again.');
    } finally {
      setReverting(null);
    }
  };

  const getPlayerScore = (playerId: string) => {
    if (!game?.scores) return 0;
    return game.scores[playerId]?.total || 0;
  };

  const getCurrentRoundScore = (playerId: string) => {
    if (!game?.scores) return null;
    return game.scores[playerId]?.rounds[game.currentRound] || null;
  };

  const hasSubmittedCurrentRound = (playerId: string) => {
    return getCurrentRoundScore(playerId) !== null;
  };

  const canSelectPlayer = (playerId: string) => {
    if (!user || !game) return false;
    // Can't select if player already submitted
    if (hasSubmittedCurrentRound(playerId)) return false;
    // Must be a participant to submit for others
    const isParticipant = game.playerIds.includes(user.uid);
    // Can select if you're a participant and the game is not closed
    return isParticipant && !game.isClosed;
  };

  const canSubmitForPlayer = (playerId: string) => {
    if (!user || !game) return false;
    // Game must not be closed
    if (game.isClosed) return false;
    // Must be a participant in the game
    const isParticipant = game.playerIds.includes(user.uid);
    if (!isParticipant) return false;
    // Can't submit if round already submitted
    if (hasSubmittedCurrentRound(playerId)) return false;
    // Can submit for yourself
    if (playerId === user.uid) return true;
    // Can submit for others (including guests) if you're a participant
    return true;
  };

  const canRevertScore = (playerId: string) => {
    if (!user || !game) return false;
    // Game must not be closed
    if (game.isClosed) return false;
    // Must be a participant in the game
    if (!game.playerIds.includes(user.uid)) return false;
    // Can only revert if score exists for current round
    if (!hasSubmittedCurrentRound(playerId)) return false;
    // Can revert your own score
    if (playerId === user.uid) return true;
    // Can revert others' scores if you're a participant
    return true;
  };

  const handleAddGuest = async () => {
    if (!game || !user) return;
    
    setAddingGuest(true);
    try {
      await GameService.addGuestPlayer(game.id, guestName);
      setGuestName('');
      setGuestError(null);
    } catch (err) {
      console.error('Failed to add guest:', err);
      setGuestError('Failed to add guest. Please try again.');
    } finally {
      setAddingGuest(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gray-50 pt-16 pb-12 flex flex-col items-center"
      >
        <div role="progressbar" className="animate-pulse flex flex-col items-center space-y-4">
          <div className="h-8 w-64 bg-primary-200 rounded"></div>
          <div className="h-4 w-48 bg-primary-100 rounded"></div>
          <div className="mt-8 h-64 w-full max-w-md bg-white rounded-xl shadow-sm"></div>
        </div>
      </motion.div>
    );
  }

  if (error || !game) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="min-h-screen bg-gray-50 pt-16 pb-12 flex flex-col items-center"
      >
        <div className="rounded-lg bg-red-50 p-4 max-w-md w-full">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {error || t.games.gameNotFound}
              </h3>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const isGameComplete = game.isClosed;
  const canSubmitScore = !isGameComplete && 
    user?.uid && 
    game.playerIds.includes(user.uid) && 
    (selectedPlayerId ? canSubmitForPlayer(selectedPlayerId) : canSubmitForPlayer(user.uid));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="space-y-8"
        >
          {isGameComplete ? (
            <GameSummary game={game} />
          ) : (
            <>
              <motion.div
                variants={fadeIn}
                className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100"
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex flex-col space-y-6">
                    {/* Header with Game Info */}
                    <div className="flex flex-col space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                            <TrophyIcon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{game.title}</h2>
                            <div className="flex items-center gap-2 mt-1">
                              <ClockIcon className="h-4 w-4 text-gray-400" />
                              <time dateTime={toISOStringOrUndefined(game.updatedAt)} className="text-sm text-gray-500 truncate">
                                {formatDate(game.updatedAt)}
                              </time>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            {t.games.round} {game.currentRound}/5
                          </span>
                          {game.createdBy === user?.uid && (
                            <button
                              onClick={handleAbandonGame}
                              disabled={abandoning}
                              className="inline-flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 rounded-full text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                              title={t.games.abandonGameTitle}
                            >
                              <TrashIcon className="h-3.5 w-3.5 sm:h-3 sm:w-3 flex-shrink-0" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-start">
                          <span className="pr-3 bg-white text-sm font-medium text-gray-500">
                            {t.games.currentStandings}
                          </span>
                        </div>
                      </div>
                      
                      {/* Score Entry Mode Indicator */}
                      {canSubmitScore && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 p-3 rounded-lg bg-blue-50/50 border border-blue-100"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div className="flex items-center gap-1 text-sm font-medium text-blue-700">
                              <span>{t.games.enteringScoreFor}</span>
                              {selectedPlayerId ? (
                                <>
                                  <span>{game.players.find(p => p.id === selectedPlayerId)?.displayName}</span>
                                  {(() => {
                                    const player = game.players.find(p => p.id === selectedPlayerId);
                                    if (!player) return null;
                                    if (!('isGuest' in player) && 'verified' in player && player.verified) {
                                      return <VerifiedBadge size="xs" />;
                                    }
                                    if ('isGuest' in player && player.isGuest) {
                                      return (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                                          {t.common.guest}
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                </>
                              ) : (
                                <>
                                  <span>{game.players.find(p => p.id === user?.uid)?.displayName}</span>
                                  {(() => {
                                    const player = game.players.find(p => p.id === user?.uid);
                                    if (!player) return null;
                                    if (!('isGuest' in player) && 'verified' in player && player.verified) {
                                      return <VerifiedBadge size="xs" />;
                                    }
                                    return null;
                                  })()}
                                  <span>{t.games.you}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Players List */}
                    <div className="space-y-3">
                      {game.players.map((player) => {
                        const isCurrentUser = player.id === user?.uid;
                        const isSelected = selectedPlayerId ? selectedPlayerId === player.id : isCurrentUser;
                        const canSelect = canSelectPlayer(player.id);
                        const isClickable = (canSelect && !isSelected) || (isCurrentUser && selectedPlayerId !== null);
                        
                        return (
                          <motion.div
                            key={player.id}
                            className={`flex items-center justify-between p-4 rounded-lg 
                              border-2 transition-all duration-200
                              ${isClickable 
                                ? 'hover:border-gray-300 hover:bg-gray-50/50 cursor-pointer hover:shadow-sm' 
                                : ''
                              }
                              ${isSelected
                                ? 'border-blue-200 bg-blue-50/50 shadow-sm'
                                : 'border-gray-200 bg-white'
                              }
                              ${isCurrentUser && !selectedPlayerId
                                ? 'border-blue-100 bg-blue-50/30'
                                : ''
                              }`}
                            whileHover={isClickable ? { scale: 1.005 } : undefined}
                            whileTap={isClickable ? { scale: 0.995 } : undefined}
                            onClick={() => {
                              if (isCurrentUser && selectedPlayerId !== null) {
                                setSelectedPlayerId(null);
                              } else if (canSelect && !isSelected) {
                                setSelectedPlayerId(player.id);
                              }
                            }}
                          >
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  {/* Name and badges row */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <UserCircleIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                      {!('isGuest' in player) ? (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setStatsPopupPlayer(player);
                                          }}
                                          className="text-base font-medium text-gray-900 hover:text-blue-600 transition-colors"
                                        >
                                          {player.displayName}
                                        </button>
                                      ) : (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setStatsPopupPlayer(player);
                                          }}
                                          className="text-base font-medium text-gray-900 hover:text-blue-600 transition-colors"
                                        >
                                          {player.displayName}
                                        </button>
                                      )}
                                      {!('isGuest' in player) && 'verified' in player && player.verified && (
                                        <VerifiedBadge size="sm" />
                                      )}
                                      {'isGuest' in player && (player as GuestPlayer).isGuest && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                          {t.common.guest}
                                        </span>
                                      )}
                                      {isCurrentUser && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                                          {t.games.you.replace('(', '').replace(')', '')}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Selected badge - positioned separately */}
                                    <div className="flex items-center gap-2">
                                      <AnimatePresence>
                                        {isSelected && (
                                          <motion.span 
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-600 text-white"
                                          >
                                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            {t.games.selected}
                                          </motion.span>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  </div>
                                  
                                  {/* Score and status row */}
                                  <div className="mt-2 flex items-center gap-3 text-sm">
                                    <span className="text-gray-500">
                                      {t.games.total}: <span className="font-semibold text-gray-700">{getPlayerScore(player.id)}</span>
                                    </span>
                                    <span className="text-gray-300">•</span>
                                    {hasSubmittedCurrentRound(player.id) ? (
                                      <span className="inline-flex items-center gap-1.5 text-green-600">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        {t.games.round} {game.currentRound}: +{getCurrentRoundScore(player.id)}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRevertScore(player.id);
                                          }}
                                          disabled={reverting === player.id}
                                          className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full text-gray-400 bg-gray-100 hover:bg-gray-200 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                                          title={t.games.revertScoreTitle}
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                            <path fillRule="evenodd" d="M9.53 2.47a.75.75 0 010 1.06L4.81 8.25H15a6.75 6.75 0 010 13.5h-3a.75.75 0 010-1.5h3a5.25 5.25 0 100-10.5H4.81l4.72 4.72a.75.75 0 11-1.06 1.06l-6-6a.75.75 0 010-1.06l6-6a.75.75 0 011.06 0z" clipRule="evenodd" />
                                          </svg>
                                        </button>
                                      </span>
                                    ) : (
                                      <span className="text-gray-500">
                                        {t.games.waitingForScore}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Right side actions */}
                                <div className="flex items-center gap-2 ml-3">
                                  {'isGuest' in player && player.isGuest && game.createdBy === user?.uid && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveGuest(player.id);
                                      }}
                                      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-600 transition-colors duration-150"
                                      title={t.games.removePlayer}
                                    >
                                      <XCircleIcon className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  
                                  {/* Click hint - only show icon when clickable */}
                                  {((canSelect && !isSelected && !(isCurrentUser && selectedPlayerId !== null)) || 
                                   (isCurrentUser && selectedPlayerId !== null)) && (
                                    <div className="text-blue-500">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2z" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}

                      {/* Add Guest Card - Only show in first round */}
                      {game.currentRound === 1 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col p-4 rounded-lg border-2 border-dashed border-gray-300 bg-white hover:border-gray-400 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-2">
                                <UserCircleIcon className="h-5 w-5 text-gray-400" />
                                <div className="flex-1 relative">
                                  <input
                                    type="text"
                                    value={guestName}
                                    onChange={(e) => {
                                      const value = e.target.value.toLowerCase().slice(0, 10);
                                      setGuestName(value);
                                      setGuestError(null);
                                    }}
                                    placeholder={t.games.playerName}
                                    maxLength={10}
                                    className="block w-full text-sm border-0 focus:ring-0 px-0 placeholder-gray-400 text-black pr-10"
                                    disabled={addingGuest}
                                  />
                                  <span className="absolute right-0 top-0 text-xs text-gray-400">
                                    {guestName.length}/10
                                  </span>
                                </div>
                              </div>
                              {guestError && (
                                <p className="text-sm text-red-600">{guestError}</p>
                              )}
                              <button
                                onClick={handleAddGuest}
                                disabled={addingGuest || !guestName.trim()}
                                className={`w-full py-2 px-3 text-sm font-medium rounded-md 
                                  ${addingGuest || !guestName.trim()
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                  } transition-colors`}
                              >
                                {addingGuest ? t.games.creatingGame : t.games.addPlayer}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {canSubmitScore ? (
                <ScoreEntry
                  onScoreSubmit={handleScoreSubmit}
                  isSubmitting={submitting}
                  selectedPlayer={selectedPlayerId 
                    ? game.players.find(p => p.id === selectedPlayerId) 
                    : game.players.find(p => p.id === user?.uid)
                  }
                />
              ) : (
                <motion.div
                  variants={fadeIn}
                  className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100"
                >
                  <p className="text-gray-500">
                    {hasSubmittedCurrentRound(user?.uid || '') 
                      ? t.games.waitingForOthers
                      : t.games.notParticipant}
                  </p>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>
      
      {/* In-game Stats Popup */}
      {statsPopupPlayer && game && !game.isClosed && (
        <InGameStatsPopup
          isOpen={true}
          onClose={() => setStatsPopupPlayer(null)}
          player={statsPopupPlayer}
          currentGame={game}
        />
      )}
      
      {/* AI Spectator - show only for active participants */}
      {game && !game.isClosed && user && game.playerIds.includes(user.uid) && aiCoachEnabled && (
        <AISpectator
          game={game}
          currentRound={game.currentRound}
          players={game.players}
        />
      )}
    </div>
  );
} 