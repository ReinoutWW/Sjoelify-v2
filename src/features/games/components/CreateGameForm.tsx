'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/context/auth-context';
import { GameService } from '../services/game-service';
import { useFriends } from '@/features/friends/hooks/use-friends';
import { UserProfile } from '@/features/account/types';
import { fadeIn, staggerChildren } from '@/shared/styles/animations';
import { toast } from 'react-hot-toast';
import { UserPlusIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface PlayerSelection {
  id: string;
  displayName: string;
  selected: boolean;
}

const TITLE_MAX_LENGTH = 50;
const TITLE_MIN_LENGTH = 3;
const TITLE_PATTERN = /^[a-zA-Z0-9\s-]*$/;

// Generate default game title with current date
const generateDefaultTitle = (): string => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `game-${month}-${day}`;
};

export function CreateGameForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { friends: availablePlayers, loading: playersLoading } = useFriends(user?.uid);
  const [title, setTitle] = useState(generateDefaultTitle());
  const [titleError, setTitleError] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerSelection[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  const validateTitle = (value: string): string | null => {
    if (value.length < TITLE_MIN_LENGTH) {
      return `Title must be at least ${TITLE_MIN_LENGTH} characters`;
    }
    if (value.length > TITLE_MAX_LENGTH) {
      return `Title cannot exceed ${TITLE_MAX_LENGTH} characters`;
    }
    if (!TITLE_PATTERN.test(value)) {
      return 'Title can only contain letters, numbers, spaces, and hyphens';
    }
    return null;
  };

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setTitleError(validateTitle(newTitle));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    // Validate title before submission
    const titleValidationError = validateTitle(title);
    if (titleValidationError) {
      setTitleError(titleValidationError);
      return;
    }

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

      if (selectedPlayerIds.length < 1 || selectedPlayerIds.length > 10) {
        throw new Error('Please select between 1 and 10 players (including yourself)');
      }

      const gameId = await GameService.createGame(
        title.trim(),
        user.uid,
        selectedPlayerIds
      );

      router.push(`/games/${gameId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create game';
      setError(errorMessage);
      toast.error(errorMessage);
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

  const filteredPlayers = players.filter(player =>
    player.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex justify-between items-center">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Game Title
          </label>
          <span className="text-sm text-gray-500">
            {title.length}/{TITLE_MAX_LENGTH}
          </span>
        </div>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            type="text"
            id="title"
            value={title}
            onChange={handleTitleChange}
            required
            maxLength={TITLE_MAX_LENGTH}
            className={`block w-full px-4 py-3 rounded-lg border ${
              titleError 
                ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
            } text-gray-900 placeholder-gray-400 bg-white transition-shadow duration-200`}
            placeholder="e.g., weekend-match or team-battle"
          />
          {titleError && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
            </div>
          )}
        </div>
        {titleError && (
          <p className="mt-2 text-sm text-red-600">{titleError}</p>
        )}
        <p className="mt-2 text-sm text-gray-500">
          Use letters, numbers, spaces, and hyphens only
        </p>
      </motion.div>

      <motion.div variants={fadeIn} className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Select Friends to Play With
        </label>
        {players.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-lg border-2 border-dashed border-gray-300">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No friends yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add some friends first to start playing with them!
            </p>
            <div className="mt-6">
              <Link
                href="/friends"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              >
                <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Go to Friends Page
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                placeholder="Search friends..."
                className="block w-full px-4 py-3 rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500 text-gray-900 placeholder-gray-400 bg-white transition-shadow duration-200 mb-4"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              {filteredPlayers.length > 0 ? (
                filteredPlayers.map(player => (
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
                ))
              ) : (
                <motion.div
                  variants={fadeIn}
                  className="text-center py-8 px-4 rounded-lg border-2 border-dashed border-gray-300"
                >
                  <p className="text-sm text-gray-500">
                    No friends found matching your search
                  </p>
                </motion.div>
              )}
            </div>
          </>
        )}
      </motion.div>

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