'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/context/auth-context';
import { GameService } from '../services/game-service';
import { usePlayers } from '@/features/account/hooks/use-players';
import { UserProfile } from '@/features/account/types';
import { fadeIn, staggerChildren } from '@/shared/styles/animations';

interface PlayerSelection {
  id: string;
  displayName: string;
  selected: boolean;
}

export function CreateGameForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { players: availablePlayers, loading: playersLoading } = usePlayers(user?.uid);
  const [title, setTitle] = useState('');
  const [players, setPlayers] = useState<PlayerSelection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update players list when available players change
  useEffect(() => {
    if (availablePlayers) {
      setPlayers(
        availablePlayers.map(player => ({
          id: player.id,
          displayName: player.displayName,
          selected: false,
        }))
      );
    }
  }, [availablePlayers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);

      const selectedPlayerIds = players
        .filter(p => p.selected)
        .map(p => p.id);

      // Always include the creator
      if (!selectedPlayerIds.includes(user.uid)) {
        selectedPlayerIds.push(user.uid);
      }

      if (selectedPlayerIds.length < 2 || selectedPlayerIds.length > 5) {
        throw new Error('Please select between 2 and 5 players (including yourself)');
      }

      const gameId = await GameService.createGame(
        title,
        user.uid,
        selectedPlayerIds
      );

      router.push(`/games/${gameId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const togglePlayer = (playerId: string) => {
    setPlayers(current =>
      current.map(p =>
        p.id === playerId ? { ...p, selected: !p.selected } : p
      )
    );
  };

  if (playersLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-12"
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

  return (
    <motion.form
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      <motion.div variants={fadeIn}>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Game Title
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            required
            className="block w-full px-4 py-3 rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500 text-gray-900 placeholder-gray-400 bg-white transition-shadow duration-200"
            placeholder="e.g., Sunday Evening Game"
          />
        </div>
      </motion.div>

      <motion.div variants={fadeIn} className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Select Players (2-5)
        </label>
        <div className="mt-2 grid grid-cols-1 gap-3">
          {players.map(player => (
            <motion.div
              key={player.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <label className="relative flex items-center p-4 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <input
                  type="checkbox"
                  checked={player.selected}
                  onChange={() => togglePlayer(player.id)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-colors duration-200"
                />
                <span className="ml-3 flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {player.displayName}
                  </span>
                </span>
                {player.selected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary-600"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                )}
              </label>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-red-50 p-4"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </motion.div>
      )}

      <motion.button
        variants={fadeIn}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        type="submit"
        disabled={loading || playersLoading}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        {loading ? (
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Creating...</span>
          </div>
        ) : (
          'Create Game'
        )}
      </motion.button>
    </motion.form>
  );
} 