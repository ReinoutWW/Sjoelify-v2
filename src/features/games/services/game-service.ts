import { collection, addDoc, updateDoc, doc, getDoc, query, where, getDocs, orderBy, limit, runTransaction, onSnapshot, Query, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Game, Round, PlayerScore, GuestPlayer } from '../types';
import { UserProfile } from '@/features/account/types';

export class GameService {
  private static gamesCollection = 'games';
  private static roundsCollection = 'rounds';

  static async createGame(title: string, creatorId: string, playerIds: string[]): Promise<string> {
    const newGame: Omit<Game, 'id' | 'createdAt' | 'updatedAt' | 'players'> = {
      title,
      createdBy: creatorId,
      playerIds,
      currentRound: 1,
      isClosed: false,
      scores: playerIds.reduce((acc, playerId) => ({
        ...acc,
        [playerId]: { total: 0, rounds: {} }
      }), {}),
      guestPlayers: []
    };

    const docRef = await addDoc(collection(db, this.gamesCollection), {
      ...newGame,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return docRef.id;
  }

  static async addGuestPlayer(gameId: string, displayName: string): Promise<string> {
    const gameRef = doc(db, this.gamesCollection, gameId);
    const gameDoc = await getDoc(gameRef);
    
    if (!gameDoc.exists()) throw new Error('Game not found');
    
    const gameData = gameDoc.data() as Game;
    if (gameData.currentRound > 1) throw new Error('Cannot add guest players after first round');
    
    // Create a unique ID for the guest player
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const guestPlayer: GuestPlayer = {
      id: guestId,
      displayName: displayName.toLowerCase(),
      isGuest: true
    };
    
    await updateDoc(gameRef, {
      [`guestPlayers`]: [...(gameData.guestPlayers || []), guestPlayer],
      playerIds: [...gameData.playerIds, guestId],
      [`scores.${guestId}`]: { total: 0, rounds: {} },
      updatedAt: new Date()
    });
    
    return guestId;
  }

  static async removeGuest(gameId: string, guestId: string): Promise<void> {
    const gameRef = doc(db, this.gamesCollection, gameId);
    const gameDoc = await getDoc(gameRef);
    
    if (!gameDoc.exists()) throw new Error('Game not found');
    
    const gameData = gameDoc.data() as Game;
    // Remove restriction - guests can be removed at any time
    // if (gameData.currentRound > 1) throw new Error('Cannot remove guest players after first round');
    
    // Remove guest from guestPlayers array and playerIds
    const updatedGuestPlayers = (gameData.guestPlayers || []).filter(guest => guest.id !== guestId);
    const updatedPlayerIds = gameData.playerIds.filter(id => id !== guestId);
    
    // Remove guest scores
    const { [guestId]: removedScore, ...updatedScores } = gameData.scores;
    
    await updateDoc(gameRef, {
      guestPlayers: updatedGuestPlayers,
      playerIds: updatedPlayerIds,
      scores: updatedScores,
      updatedAt: new Date()
    });
  }

  static async getGame(gameId: string): Promise<Game | null> {
    const gameDoc = await getDoc(doc(db, this.gamesCollection, gameId));
    if (!gameDoc.exists()) return null;

    const gameData = gameDoc.data() as Game;
    
    // Fetch player details for non-guest players
    const regularPlayerIds = gameData.playerIds.filter(id => !id.startsWith('guest_'));
    let players: (UserProfile | GuestPlayer)[] = [];
    
    if (regularPlayerIds.length > 0) {
      const playersQuery = query(
        collection(db, 'users'),
        where('id', 'in', regularPlayerIds)
      );
      const playersSnapshot = await getDocs(playersQuery);
      players = playersSnapshot.docs.map(doc => doc.data() as UserProfile);
    }
    
    // Add guest players to the players array
    if (gameData.guestPlayers?.length) {
      players = [...players, ...gameData.guestPlayers];
    }

    // Fetch rounds
    const roundsQuery = query(
      collection(db, this.gamesCollection, gameId, this.roundsCollection),
      orderBy('roundNumber', 'asc')
    );
    const roundsSnapshot = await getDocs(roundsQuery);
    const rounds = roundsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Round[];

    return {
      ...gameData,
      id: gameDoc.id,
      players,
      rounds
    };
  }

  static async updateGame(gameId: string, updates: Partial<Game>): Promise<void> {
    const gameRef = doc(db, this.gamesCollection, gameId);
    await updateDoc(gameRef, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  static async deleteGame(gameId: string): Promise<void> {
    const gameRef = doc(db, this.gamesCollection, gameId);
    await deleteDoc(gameRef);
  }

  static async addRound(gameId: string, round: Omit<Round, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const roundsRef = collection(db, this.gamesCollection, gameId, this.roundsCollection);
    const docRef = await addDoc(roundsRef, {
      ...round,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return docRef.id;
  }

  static async submitRound(
    gameId: string,
    playerId: string,
    roundNumber: number,
    scores: number[]
  ): Promise<void> {
    const gameRef = doc(db, this.gamesCollection, gameId);

    await runTransaction(db, async (transaction) => {
      const gameDoc = await transaction.get(gameRef);
      if (!gameDoc.exists()) throw new Error('Game not found');

      const gameData = gameDoc.data() as Game;
      if (gameData.isClosed) throw new Error('Game is already closed');
      if (gameData.currentRound !== roundNumber) throw new Error('Invalid round number');
      if (!gameData.playerIds.includes(playerId)) throw new Error('Player not in game');

      // Calculate round score
      // First, find how many complete sets (1 in each gate)
      const minDiscsAcrossGates = Math.min(...scores);
      const completeSets = minDiscsAcrossGates;
      const completeSetPoints = completeSets * 20;

      // Calculate leftover points after removing complete sets
      const leftoverScores = scores.map((score, index) => score - completeSets);
      const leftoverPoints = leftoverScores.reduce((total, score, index) => {
        const pointValue = index === 0 ? 2 : // First gate (2 points)
                          index === 1 ? 3 : // Second gate (3 points)
                          index === 2 ? 4 : // Third gate (4 points)
                          1;                 // Fourth gate (1 point)
        return total + (score * pointValue);
      }, 0);

      // Total round score is complete sets + leftover points
      const roundScore = completeSetPoints + leftoverPoints;

      // Convert scores array to gate string
      // Use dots only if any score is double-digit (>= 10)
      const hasDoubleDigit = scores.some(score => score >= 10);
      const gateString = hasDoubleDigit 
        ? scores.join('.') 
        : scores.join('');

      // Add round
      const roundRef = doc(collection(db, this.gamesCollection, gameId, this.roundsCollection));
      transaction.set(roundRef, {
        playerId,
        roundNumber,
        scores,
        gateString,
        completeSets,
        completeSetPoints,
        leftoverPoints,
        totalScore: roundScore,
        createdAt: new Date()
      });

      // Update game scores
      const playerScores = gameData.scores || {};
      const currentPlayerScore = playerScores[playerId] || { total: 0, rounds: {} };
      
      const updatedPlayerScore = {
        total: currentPlayerScore.total + roundScore,
        rounds: {
          ...currentPlayerScore.rounds,
          [roundNumber]: roundScore
        },
        roundDetails: {
          ...(currentPlayerScore.roundDetails || {}),
          [roundNumber]: gateString
        }
      };

      // Check if all players have submitted for this round
      const roundQuery = query(
        collection(db, this.gamesCollection, gameId, this.roundsCollection),
        where('roundNumber', '==', roundNumber)
      );
      const roundDocs = await getDocs(roundQuery);
      const submittedPlayers = new Set(roundDocs.docs.map(doc => doc.data().playerId));
      submittedPlayers.add(playerId); // Add current submission

      // If all players have submitted, advance to next round
      const shouldAdvanceRound = submittedPlayers.size === gameData.playerIds.length;
      const isLastRound = roundNumber === 5;

      transaction.update(gameRef, {
        [`scores.${playerId}`]: updatedPlayerScore,
        currentRound: shouldAdvanceRound ? (isLastRound ? 5 : roundNumber + 1) : roundNumber,
        isClosed: shouldAdvanceRound && isLastRound,
        updatedAt: new Date()
      });

      // Game is completed, but we don't need to do anything special
      if (shouldAdvanceRound && isLastRound) {
        // Game completed
        console.log('Game completed:', gameId);
      }
    });
  }

  static async revertRoundSubmission(
    gameId: string,
    playerId: string,
    roundNumber: number
  ): Promise<void> {
    const gameRef = doc(db, this.gamesCollection, gameId);

    await runTransaction(db, async (transaction) => {
      const gameDoc = await transaction.get(gameRef);
      if (!gameDoc.exists()) throw new Error('Game not found');

      const gameData = gameDoc.data() as Game;
      if (!gameData.playerIds.includes(playerId)) throw new Error('Player not in game');

      // Find and delete the round document
      const roundQuery = query(
        collection(db, this.gamesCollection, gameId, this.roundsCollection),
        where('playerId', '==', playerId),
        where('roundNumber', '==', roundNumber)
      );
      const roundDocs = await getDocs(roundQuery);
      
      if (roundDocs.empty) {
        throw new Error('Round submission not found');
      }

      // Get the round score before deleting
      const roundDoc = roundDocs.docs[0];
      const roundData = roundDoc.data() as Round;
      const roundScore = roundData.totalScore;

      // Delete the round document
      transaction.delete(roundDoc.ref);

      // Update the player's score in the game document
      const playerScores = gameData.scores || {};
      const currentPlayerScore = playerScores[playerId] || { total: 0, rounds: {} };
      
      // Remove the round score
      const updatedRounds = { ...currentPlayerScore.rounds };
      delete updatedRounds[roundNumber];
      
      // Remove the round details
      const updatedRoundDetails = { ...(currentPlayerScore.roundDetails || {}) };
      delete updatedRoundDetails[roundNumber];
      
      const updatedPlayerScore = {
        total: currentPlayerScore.total - roundScore,
        rounds: updatedRounds,
        roundDetails: Object.keys(updatedRoundDetails).length > 0 ? updatedRoundDetails : undefined
      };

      // Check if we need to adjust the current round
      // If the game had advanced to the next round, we might need to revert it
      let newCurrentRound = gameData.currentRound;
      let newIsClosed = gameData.isClosed;

      // Check how many players have submitted for the current round after this deletion
      const currentRoundQuery = query(
        collection(db, this.gamesCollection, gameId, this.roundsCollection),
        where('roundNumber', '==', roundNumber)
      );
      const currentRoundDocs = await getDocs(currentRoundQuery);
      const remainingSubmissions = currentRoundDocs.docs.filter(doc => doc.id !== roundDoc.id);

      // If this was the last submission that caused the round to advance, revert it
      if (gameData.currentRound > roundNumber || gameData.isClosed) {
        // The round had advanced, so we need to check if we should revert
        if (remainingSubmissions.length < gameData.playerIds.length - 1) {
          // Not all other players have submitted, so revert to this round
          newCurrentRound = roundNumber;
          newIsClosed = false;
        }
      }

      transaction.update(gameRef, {
        [`scores.${playerId}`]: updatedPlayerScore,
        currentRound: newCurrentRound,
        isClosed: newIsClosed,
        updatedAt: new Date()
      });
    });
  }

  static async getActiveGames(userId: string): Promise<Game[]> {
    const q = query(
      collection(db, this.gamesCollection),
      where('playerIds', 'array-contains', userId),
      where('isClosed', '==', false),
      orderBy('updatedAt', 'desc'),
      limit(10)
    );

    return this.fetchGamesWithPlayers(q);
  }

  static async getFinishedGames(userId: string): Promise<Game[]> {
    const q = query(
      collection(db, this.gamesCollection),
      where('playerIds', 'array-contains', userId),
      where('isClosed', '==', true),
      orderBy('updatedAt', 'desc'),
      limit(10)
    );

    return this.fetchGamesWithPlayers(q);
  }

  private static async fetchGamesWithPlayers(q: Query): Promise<Game[]> {
    const snapshot = await getDocs(q);
    const games = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const gameData = doc.data() as Omit<Game, 'id' | 'players'>;
        
        // Fetch regular player details
        const regularPlayerIds = gameData.playerIds.filter(id => !id.startsWith('guest_'));
        let players: (UserProfile | GuestPlayer)[] = [];
        
        if (regularPlayerIds.length > 0) {
          const playersQuery = query(
            collection(db, 'users'),
            where('id', 'in', regularPlayerIds)
          );
          const playersSnapshot = await getDocs(playersQuery);
          players = playersSnapshot.docs.map(doc => doc.data() as UserProfile);
        }
        
        // Add guest players
        if (gameData.guestPlayers?.length) {
          players = [...players, ...gameData.guestPlayers];
        }

        return {
          ...gameData,
          id: doc.id,
          players
        } as Game;
      })
    );

    return games;
  }

  static async getGameStats(gameId: string): Promise<{
    highestScore: number;
    averageScore: number;
    totalRounds: number;
    playerStats: Record<string, {
      totalScore: number;
      averageScore: number;
      bestRound: number;
    }>;
  }> {
    const game = await this.getGame(gameId);
    if (!game) throw new Error('Game not found');

    const roundsQuery = query(
      collection(db, this.gamesCollection, gameId, this.roundsCollection)
    );
    const roundsSnapshot = await getDocs(roundsQuery);
    const rounds = roundsSnapshot.docs.map(doc => doc.data() as Round);

    const playerStats: Record<string, {
      totalScore: number;
      scores: number[];
      bestRound: number;
    }> = {};

    rounds.forEach(round => {
      if (!playerStats[round.playerId]) {
        playerStats[round.playerId] = {
          totalScore: 0,
          scores: [],
          bestRound: 0
        };
      }

      playerStats[round.playerId].totalScore += round.totalScore;
      playerStats[round.playerId].scores.push(round.totalScore);
      playerStats[round.playerId].bestRound = Math.max(
        playerStats[round.playerId].bestRound,
        round.totalScore
      );
    });

    const stats = {
      highestScore: 0,
      averageScore: 0,
      totalRounds: rounds.length,
      playerStats: {} as Record<string, {
        totalScore: number;
        averageScore: number;
        bestRound: number;
      }>
    };

    Object.entries(playerStats).forEach(([playerId, data]) => {
      const averageScore = data.scores.length > 0
        ? data.totalScore / data.scores.length
        : 0;

      stats.playerStats[playerId] = {
        totalScore: data.totalScore,
        averageScore,
        bestRound: data.bestRound
      };

      stats.highestScore = Math.max(stats.highestScore, data.bestRound);
      stats.averageScore += data.totalScore;
    });

    stats.averageScore = stats.averageScore / Object.keys(playerStats).length;

    return stats;
  }

  static subscribeToGame(gameId: string, callback: (game: Game | null) => void): () => void {
    const gameRef = doc(db, this.gamesCollection, gameId);
    
    // Subscribe to game document changes
    const unsubscribeGame = onSnapshot(gameRef, async (gameDoc) => {
      if (!gameDoc.exists()) {
        callback(null);
        return;
      }

      const gameData = gameDoc.data() as Game;

      try {
        // Fetch regular player details
        const regularPlayerIds = gameData.playerIds.filter(id => !id.startsWith('guest_'));
        let players: (UserProfile | GuestPlayer)[] = [];
        
        if (regularPlayerIds.length > 0) {
          const playersQuery = query(
            collection(db, 'users'),
            where('id', 'in', regularPlayerIds)
          );
          const playersSnapshot = await getDocs(playersQuery);
          players = playersSnapshot.docs.map(doc => doc.data() as UserProfile);
        }
        
        // Add guest players
        if (gameData.guestPlayers?.length) {
          players = [...players, ...gameData.guestPlayers];
        }

        // Subscribe to rounds collection
        const roundsQuery = query(
          collection(db, this.gamesCollection, gameId, this.roundsCollection),
          orderBy('roundNumber', 'asc')
        );
        const roundsSnapshot = await getDocs(roundsQuery);
        const rounds = roundsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Round[];

        callback({
          ...gameData,
          id: gameDoc.id,
          players,
          rounds
        });
      } catch (error) {
        console.error('Error fetching related game data:', error);
        callback(null);
      }
    });

    return () => {
      unsubscribeGame();
    };
  }
} 