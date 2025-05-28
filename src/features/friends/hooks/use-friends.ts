import { useState, useEffect } from 'react';
import { FriendsService } from '../services/friends-service';
import { UserProfile } from '@/features/account/types';

export function useFriends(userId: string | undefined) {
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setFriends([]);
      setLoading(false);
      return;
    }

    // Subscribe to friends updates
    const unsubscribe = FriendsService.subscribeToFriendships(
      userId,
      (updatedFriends) => {
        setFriends(updatedFriends);
        setLoading(false);
      },
      (err) => {
        console.error('Error in friends subscription:', err);
        setError('Failed to load friends');
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount or userId change
    return () => {
      unsubscribe();
    };
  }, [userId]);

  return { friends, loading, error };
} 