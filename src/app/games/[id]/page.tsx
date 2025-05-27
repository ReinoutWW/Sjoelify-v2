'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/context/auth-context';
import { GameService } from '@/features/games/services/game-service';
import { ScoreEntry } from '@/features/games/components/ScoreEntry';
import { useGame } from '@/features/games/hooks/use-game';
import { fadeIn, slideIn } from '@/shared/styles/animations';

export default function GamePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { game, loading, error } = useGame(id as string);
  const [submitting, setSubmitting] = useState(false);

  const handleScoreSubmit = async (scores: number[]) => {
    if (!game || !user) return;
    
    setSubmitting(true);
    try {
      await GameService.submitRound(game.id, user.uid, game.currentRound, scores);
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
    !hasSubmittedCurrentRound(user.uid);

  return (
    <div className="min-h-screen bg-gray-50 pt-8 sm:pt-16 pb-8 sm:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="text-center mb-6 sm:mb-12"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{game.title}</h1>
          <p className="mt-2 text-sm text-gray-500">
            {isGameComplete ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Game Complete
              </span>
            ) : (
              `Round ${game.currentRound} of 5`
            )}
          </p>
        </motion.div>

        <motion.div
          variants={slideIn}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-white shadow-lg rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {game.players.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center space-x-3 p-3 sm:p-4 rounded-lg ${
                    hasSubmittedCurrentRound(player.id) 
                      ? 'bg-primary-50 border border-primary-100' 
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-700 font-medium text-sm sm:text-base">
                        {player.displayName[0].toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium text-gray-900 truncate">
                      {player.displayName}
                      {player.id === user?.uid && ' (You)'}
                    </p>
                    <div className="flex items-center mt-1">
                      <p className="text-xs sm:text-sm text-gray-500">
                        Total: {getPlayerScore(player.id)}
                      </p>
                      {hasSubmittedCurrentRound(player.id) && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                          +{getCurrentRoundScore(player.id)}
                        </span>
                      )}
                    </div>
                  </div>
                  {hasSubmittedCurrentRound(player.id) && (
                    <div className="flex-shrink-0">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {canSubmitScore ? (
            <ScoreEntry
              onScoreSubmit={handleScoreSubmit}
              isSubmitting={submitting}
            />
          ) : (
            <motion.div
              variants={fadeIn}
              className="text-center p-4 sm:p-6 bg-white rounded-xl shadow-lg"
            >
              {isGameComplete ? (
                <p className="text-sm sm:text-base text-gray-500">This game has been completed!</p>
              ) : hasSubmittedCurrentRound(user?.uid || '') ? (
                <p className="text-sm sm:text-base text-gray-500">Waiting for other players to submit their scores...</p>
              ) : (
                <p className="text-sm sm:text-base text-gray-500">You are not a participant in this game.</p>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 