import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { UserProfile } from '@/features/account/types';

interface PlayerScore {
  total: number;
  rounds: Record<number, number>;
}

interface Game {
  id: string;
  title: string;
  createdBy: string;
  playerIds: string[];
  players: UserProfile[];
  currentRound: number;
  isClosed: boolean;
  createdAt: Date;
  updatedAt: {
    seconds: number;
    nanoseconds: number;
  };
  scores: Record<string, PlayerScore>;
}

export interface LeaderboardEntry {
  playerId: string;
  displayName: string;
  gamesPlayed: number;
  totalScore: number;
  averageScore: number;
  bestScore: number;
  bestGameId: string;
  lastPlayed: Date;
}

export class LeaderboardService {
  private static gamesCollection = 'games';
  private static usersCollection = 'users';

  private static convertTimestampToDate(timestamp: { seconds: number; nanoseconds: number }): Date {
    try {
      if (!timestamp || typeof timestamp.seconds !== 'number') {
        console.error('Invalid timestamp:', timestamp);
        return new Date();
      }
      return new Date(timestamp.seconds * 1000);
    } catch (error) {
      console.error('Error converting timestamp:', error);
      return new Date();
    }
  }

  static async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      console.log('Starting leaderboard fetch...');
      console.log('Firebase db instance:', !!db);

      // Get all completed games
      const gamesQuery = query(
        collection(db, this.gamesCollection),
        where('isClosed', '==', true),
        orderBy('updatedAt', 'desc')
      );

      // Get all users for player information
      const usersQuery = query(collection(db, this.usersCollection));
      
      console.log('Executing Firebase queries...');
      const [gamesSnapshot, usersSnapshot] = await Promise.all([
        getDocs(gamesQuery),
        getDocs(usersQuery)
      ]);

      console.log('Games found:', gamesSnapshot.size);
      console.log('Users found:', usersSnapshot.size);

      if (gamesSnapshot.size === 0) {
        console.log('No games found in the database');
        return [];
      }

      if (usersSnapshot.size === 0) {
        console.log('No users found in the database');
        return [];
      }

      // Create a map of user IDs to display names
      const userMap = new Map<string, string>();
      usersSnapshot.forEach(doc => {
        const userData = doc.data() as UserProfile;
        console.log('Processing user:', doc.id, userData);
        if (userData.displayName) {
          userMap.set(doc.id, userData.displayName);
        }
      });

      console.log('Users with display names:', userMap.size);
      console.log('User map:', Object.fromEntries(userMap));

      const playerStats = new Map<string, {
        displayName: string;
        gamesPlayed: number;
        scores: number[];
        bestScore: number;
        bestGameId: string;
        lastPlayed: Date;
      }>();

      // Process all games and aggregate player statistics
      gamesSnapshot.forEach((doc) => {
        try {
          const gameData = doc.data();
          const gameId = doc.id;

          console.log('Processing game:', gameId, {
            isClosed: gameData.isClosed,
            playerIds: gameData.playerIds?.length,
            hasScores: !!gameData.scores,
            updatedAt: gameData.updatedAt,
            scores: gameData.scores
          });

          // Skip invalid games
          if (!gameData.isClosed || !gameData.scores || !gameData.updatedAt) {
            console.warn('Skipping invalid game:', gameId, {
              isClosed: gameData.isClosed,
              hasScores: !!gameData.scores,
              hasUpdatedAt: !!gameData.updatedAt
            });
            return;
          }

          const scores = gameData.scores as Record<string, { total: number }>;
          const updatedAt = this.convertTimestampToDate(gameData.updatedAt);

          // Process each player's score in the game
          Object.entries(scores).forEach(([playerId, scoreData]) => {
            try {
              const displayName = userMap.get(playerId);
              if (!displayName) {
                console.warn('No display name found for player:', playerId);
                return;
              }

              const totalScore = typeof scoreData.total === 'number' ? scoreData.total : 0;
              console.log('Processing score:', {
                playerId,
                displayName,
                gameId,
                totalScore,
                scoreData
              });

              const currentStats = playerStats.get(playerId) || {
                displayName,
                gamesPlayed: 0,
                scores: [] as number[],
                bestScore: 0,
                bestGameId: '',
                lastPlayed: updatedAt
              };

              currentStats.scores.push(totalScore);
              currentStats.gamesPlayed++;

              // Update best score if current score is higher
              if (totalScore > currentStats.bestScore) {
                currentStats.bestScore = totalScore;
                currentStats.bestGameId = gameId;
              }

              // Update last played if this game is more recent
              if (!currentStats.lastPlayed || updatedAt > currentStats.lastPlayed) {
                currentStats.lastPlayed = updatedAt;
              }

              playerStats.set(playerId, currentStats);
            } catch (playerError) {
              console.error('Error processing player:', playerId, playerError);
            }
          });
        } catch (gameError) {
          console.error('Error processing game:', doc.id, gameError);
        }
      });

      console.log('Players with stats:', playerStats.size);
      console.log('Player stats:', Object.fromEntries(playerStats));

      if (playerStats.size === 0) {
        console.warn('No valid player stats found');
        return [];
      }

      // Convert Map to array and calculate averages
      const leaderboard = Array.from(playerStats.entries()).map(([playerId, stats]) => {
        const entry = {
          playerId,
          displayName: stats.displayName,
          gamesPlayed: stats.gamesPlayed,
          totalScore: stats.scores.reduce((sum, score) => sum + score, 0),
          averageScore: Math.round(
            stats.scores.reduce((sum, score) => sum + score, 0) / stats.gamesPlayed
          ),
          bestScore: stats.bestScore,
          bestGameId: stats.bestGameId,
          lastPlayed: stats.lastPlayed
        };
        console.log('Created leaderboard entry:', entry);
        return entry;
      });

      console.log('Final leaderboard entries:', leaderboard.length);
      console.log('Leaderboard data:', leaderboard);

      // Sort by best score descending
      return leaderboard.sort((a, b) => b.bestScore - a.bestScore);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }
} 