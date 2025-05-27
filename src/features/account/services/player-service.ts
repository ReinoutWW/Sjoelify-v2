import { collection, getDocs, query, where, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserProfile } from '../types';

export class PlayerService {
  static async getAllPlayers(): Promise<UserProfile[]> {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserProfile[];
  }

  static async getPlayerById(playerId: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', playerId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as UserProfile;
  }

  static async updatePlayerProfile(
    playerId: string,
    updates: Partial<Omit<UserProfile, 'id'>>
  ): Promise<void> {
    const docRef = doc(db, 'users', playerId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    });
  }

  static async searchPlayers(searchTerm: string): Promise<UserProfile[]> {
    // Note: Firestore doesn't support native text search
    // For a production app, consider using Algolia or similar
    const players = await this.getAllPlayers();
    return players.filter(player => 
      player.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
} 