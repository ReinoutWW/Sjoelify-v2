'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { setAnalyticsUserId, logUserLogin, logUserLogout } from '@/lib/analytics';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [previousUser, setPreviousUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if auth is initialized
    if (!auth) {
      console.warn('Firebase auth not initialized');
      setLoading(false);
      return;
    }

    // Set up auth state listener
    const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
      setUser(user);
      setLoading(false);
      
      // Track authentication events and set user ID for analytics
      if (user && !previousUser) {
        // User logged in
        setAnalyticsUserId(user.uid);
        const provider = user.providerData[0]?.providerId || 'unknown';
        logUserLogin(provider);
      } else if (!user && previousUser) {
        // User logged out
        logUserLogout();
        setAnalyticsUserId(null);
      } else if (user) {
        // Ensure user ID is set (for page refreshes)
        setAnalyticsUserId(user.uid);
      }
      
      setPreviousUser(user);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [previousUser]);

  return (
    <AuthContext.Provider value={{ user, loading, signIn: async () => {}, signOut: async () => {} }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 