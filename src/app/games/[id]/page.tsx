'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/context/auth-context';
import { GameService } from '@/features/games/services/game-service';
import { ScoreEntry } from '@/features/games/components/ScoreEntry';
import { GameSummary } from '@/features/games/components/GameSummary';
import { useGame } from '@/features/games/hooks/use-game';
import { fadeIn } from '@/shared/styles/animations';
import { TrophyIcon, ClockIcon } from '@heroicons/react/24/outline';

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
    // Can't select yourself (use default submission)
    if (playerId === user.uid) return false;
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                            <TrophyIcon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">{game.title}</h2>
                            <div className="flex items-center gap-2 mt-1">
                              <ClockIcon className="h-4 w-4 text-gray-400" />
                              <time dateTime={toISOStringOrUndefined(game.updatedAt)} className="text-sm text-gray-500">
                                {formatDate(game.updatedAt)}
                              </time>
                            </div>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          Round {game.currentRound}/5
                        </span>
                      </div>
                      
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-start">
                          <span className="pr-3 bg-white text-sm font-medium text-gray-500">
                            {selectedPlayerId 
                              ? `Entering Score for ${game.players.find(p => p.id === selectedPlayerId)?.displayName}`
                              : 'Current Standings'
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Players List */}
                    <div className="space-y-3">
                      {game.players.map((player) => (
                        <motion.div
                          key={player.id}
                          className={`flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-gray-50 to-transparent 
                            border border-gray-100 transition-colors duration-200
                            ${canSelectPlayer(player.id) 
                              ? 'hover:border-blue-200 cursor-pointer' 
                              : ''
                            }
                            ${selectedPlayerId === player.id
                              ? 'border-blue-400 bg-blue-50/50'
                              : ''
                            }`}
                          whileHover={canSelectPlayer(player.id) ? { scale: 1.01 } : undefined}
                          onClick={() => {
                            if (canSelectPlayer(player.id)) {
                              setSelectedPlayerId(selectedPlayerId === player.id ? null : player.id);
                            }
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-base font-medium text-gray-900 truncate">
                                {player.displayName}
                              </p>
                              {player.id === user?.uid && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                  You
                                </span>
                              )}
                              {canSelectPlayer(player.id) && (
                                <span className="text-xs text-blue-600">(Click to enter score)</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-sm text-gray-500">
                                Total: {getPlayerScore(player.id)}
                              </p>
                              {hasSubmittedCurrentRound(player.id) && (
                                <span className="inline-flex items-center gap-1 text-sm text-blue-600">
                                  <span className="text-blue-400">+</span>
                                  {getCurrentRoundScore(player.id)}
                                </span>
                              )}
                            </div>
                          </div>
                          {hasSubmittedCurrentRound(player.id) && (
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                                <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {canSubmitScore ? (
                <ScoreEntry
                  onScoreSubmit={handleScoreSubmit}
                  isSubmitting={submitting}
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