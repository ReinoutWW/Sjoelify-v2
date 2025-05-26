import { collection, addDoc, updateDoc, doc, getDoc, query, where, getDocs, orderBy, limit, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Game, Round, PlayerScore } from '../types';
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
      }), {})
    };

    const docRef = await addDoc(collection(db, this.gamesCollection), {
      ...newGame,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return docRef.id;
  }

  static async getGame(gameId: string): Promise<Game | null> {
    const gameDoc = await getDoc(doc(db, this.gamesCollection, gameId));
    if (!gameDoc.exists()) return null;

    const gameData = gameDoc.data() as Game;
    
    // Fetch player details
    const playersQuery = query(
      collection(db, 'users'),
      where('id', 'in', gameData.playerIds)
    );
    const playersSnapshot = await getDocs(playersQuery);
    const players = playersSnapshot.docs.map(doc => doc.data() as UserProfile);

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
      const pointValues = [2, 3, 4, 1];
      const roundScore = scores.reduce((total, score, index) => 
        total + (score * pointValues[index]), 0
      );

      // Add round
      const roundRef = doc(collection(db, this.gamesCollection, gameId, this.roundsCollection));
      transaction.set(roundRef, {
        playerId,
        roundNumber,
        scores,
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
    });
  }

  static async getActiveGames(userId: string): Promise<Game[]> {
    const q = query(
      collection(db, this.gamesCollection),
      where('playerIds', 'array-contains', userId),
      where('isClosed', '==', false),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    const games = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const gameData = doc.data();
        const playersQuery = query(
          collection(db, 'users'),
          where('id', 'in', gameData.playerIds)
        );
        const playersSnapshot = await getDocs(playersQuery);
        const players = playersSnapshot.docs.map(doc => doc.data() as UserProfile);

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
} 