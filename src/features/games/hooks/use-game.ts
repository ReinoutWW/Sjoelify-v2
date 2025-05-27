import { useState, useEffect } from 'react';
import { GameService } from '../services/game-service';
import { Game } from '../types';

export function useGame(gameId: string | undefined) {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setGame(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to real-time updates
    const unsubscribe = GameService.subscribeToGame(gameId, (updatedGame) => {
      setGame(updatedGame);
      setLoading(false);
      if (!updatedGame) {
        setError('Game not found');
      }
    });

    // Cleanup subscription on unmount or gameId change
    return () => {
      unsubscribe();
    };
  }, [gameId]);

  return { game, loading, error };
} 