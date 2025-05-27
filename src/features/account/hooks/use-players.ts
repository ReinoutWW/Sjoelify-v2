import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserProfile } from '../types';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export function usePlayers(currentUserId: string | undefined) {
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let retryCount = 0;
    let mounted = true;

    const fetchPlayers = async () => {
      if (!currentUserId) {
        setPlayers([]);
        setLoading(false);
        return;
      }

      try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        
        if (!mounted) return;

        const playersList = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(player => player.id !== currentUserId) as UserProfile[];

        setPlayers(playersList);
        setError(null);
      } catch (err) {
        console.error('Error fetching players:', err);
        
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`Retrying fetch (${retryCount}/${MAX_RETRIES})...`);
          setTimeout(fetchPlayers, RETRY_DELAY);
          return;
        }
        
        if (mounted) {
          setError('Failed to load players. Please check your internet connection and try again.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchPlayers();

    return () => {
      mounted = false;
    };
  }, [currentUserId]);

  return { players, loading, error };
} 