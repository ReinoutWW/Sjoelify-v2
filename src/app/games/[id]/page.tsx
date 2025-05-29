'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { GameService } from '@/features/games/services/game-service';
import { ScoreEntry } from '@/features/games/components/ScoreEntry';
import { GameSummary } from '@/features/games/components/GameSummary';
import { useGame } from '@/features/games/hooks/use-game';
import { fadeIn } from '@/shared/styles/animations';
import { TrophyIcon, ClockIcon, UserCircleIcon, TrashIcon, XCircleIcon } from '@heroicons/react/24/outline';

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
  const { game, loading, error } = useGame(id as string);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [abandoning, setAbandoning] = useState(false);
  const [reverting, setReverting] = useState<string | null>(null);
  const router = useRouter();

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
    return game.playerIds.includes(user.uid) && !game.isClosed;
  };

  const canSubmitForPlayer = (playerId: string) => {
    if (!user || !game) return false;
    // Game must not be closed
    if (game.isClosed) return false;
    // Must be a participant in the game
    if (!game.playerIds.includes(user.uid)) return false;
    // Can't submit if round already submitted
    if (hasSubmittedCurrentRound(playerId)) return false;
    // Can submit for yourself
    if (playerId === user.uid) return true;
    // Can submit for others if you're a participant and they haven't submitted
    return game.playerIds.includes(playerId);
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
                {error || 'Game not found'}
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
                            Round {game.currentRound}/5
                          </span>
                          {game.createdBy === user?.uid && (
                            <button
                              onClick={handleAbandonGame}
                              disabled={abandoning}
                              className="inline-flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 rounded-full text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                              title="Abandon game (deletes permanently)"
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
                            Current Standings
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
                            <p className="text-sm font-medium text-blue-700">
                              {selectedPlayerId 
                                ? `Entering score for ${game.players.find(p => p.id === selectedPlayerId)?.displayName}`
                                : `Entering score for ${game.players.find(p => p.id === user?.uid)?.displayName} (You)`
                              }
                            </p>
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
                            whileHover={isClickable ? { scale: 1.01 } : undefined}
                            whileTap={isClickable ? { scale: 0.99 } : undefined}
                            onClick={() => {
                              if (isCurrentUser && selectedPlayerId !== null) {
                                // Clicking on yourself returns to self-selection mode
                                setSelectedPlayerId(null);
                              } else if (canSelect && !isSelected) {
                                // Clicking on another player selects them directly (only if not already selected)
                                setSelectedPlayerId(player.id);
                              }
                            }}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <UserCircleIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                <Link 
                                  href={`/players/${player.id}`}
                                  className="text-base font-medium text-gray-900 hover:text-blue-600 transition-colors truncate"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {player.displayName}
                                </Link>
                                {isCurrentUser && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                    You
                                  </span>
                                )}
                                {isSelected && (
                                  <motion.span 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-600 text-white"
                                  >
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Selected
                                  </motion.span>
                                )}
                              </div>
                              <div className="mt-1 flex items-center gap-4">
                                <p className="text-sm text-gray-500">
                                  Total: <span className="font-medium text-gray-700">{getPlayerScore(player.id)}</span>
                                </p>
                                {hasSubmittedCurrentRound(player.id) && (
                                  <span className="inline-flex items-center gap-1 text-sm text-green-600">
                                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 001.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Round {game.currentRound}: +{getCurrentRoundScore(player.id)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {canSelect && !isSelected && !(isCurrentUser && selectedPlayerId !== null) && (
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">Click to</p>
                                  <p className="text-xs font-medium text-blue-600">enter score</p>
                                </div>
                              )}
                              {isCurrentUser && selectedPlayerId !== null && (
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">Click to</p>
                                  <p className="text-xs font-medium text-blue-600">enter your score</p>
                                </div>
                              )}
                              {hasSubmittedCurrentRound(player.id) && (
                                <div className="flex items-center gap-2">
                                  {canRevertScore(player.id) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRevertScore(player.id);
                                      }}
                                      disabled={reverting === player.id}
                                      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                      title="Revert score submission"
                                    >
                                      <XCircleIcon className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  <div className="flex-shrink-0">
                                    <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
                                      <svg className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 001.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
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
                      ? 'Waiting for other players to submit their scores...'
                      : 'You are not a participant in this game.'}
                  </p>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
} 