'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UsernameSelectionModal } from './UsernameSelectionModal';

export function UsernameEnforcer() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!user) {
      setShowModal(false);
      return;
    }

    // Set up real-time listener for user document
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          console.log('UsernameEnforcer: User data updated', userData);
          
          // Check if user needs to set username
          if (userData.needsUsername && !userData.displayName) {
            console.log('UsernameEnforcer: User needs username');
            setUserEmail(user.email);
            setShowModal(true);
          } else {
            setShowModal(false);
          }
        } else {
          // Document doesn't exist yet, check again after a delay
          if (!isChecking) {
            setIsChecking(true);
            console.log('UsernameEnforcer: User doc not found, checking again...');
            setTimeout(() => {
              setIsChecking(false);
            }, 1000);
          }
        }
      },
      (error) => {
        console.error('UsernameEnforcer: Error listening to user doc', error);
      }
    );

    return () => unsubscribe();
  }, [user, isChecking]);

  const handleComplete = () => {
    console.log('UsernameEnforcer: Username set, closing modal');
    setShowModal(false);
  };

  return (
    <UsernameSelectionModal
      isOpen={showModal}
      onComplete={handleComplete}
      userEmail={userEmail}
    />
  );
} 