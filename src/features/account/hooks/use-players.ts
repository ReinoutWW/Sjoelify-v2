import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserProfile } from '../types';

export function usePlayers(excludeUserId?: string) {
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const usersRef = collection(db, 'users');
        let q = query(usersRef);
        
        if (excludeUserId) {
          q = query(usersRef, where('id', '!=', excludeUserId));
        }

        const snapshot = await getDocs(q);
        const playerData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as UserProfile[];

        setPlayers(playerData);
      } catch (err) {
        setError('Failed to fetch players');
        console.error('Error fetching players:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [excludeUserId]);

  return { players, loading, error };
} 