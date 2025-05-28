import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { UserProfile } from '@/features/account/types';

interface PlayerScore {
  total: number;
  rounds: Record<number, number>;
}

interface GameScore {
  total?: number;
  rounds?: Record<string, number>;
}

interface ScoreWithTimestamp {
  score: number;
  timestamp: Date;
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
  scores: Record<string, GameScore>;
}

interface PlayerStats {
  displayName: string;
  gamesPlayed: number;
  scores: ScoreWithTimestamp[];  // Each score with its timestamp
  bestScore: number;
  bestGameId: string;
  lastPlayed: Date;
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
  scoreHistory: ScoreWithTimestamp[];  // Add score history with timestamps
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
        userMap.set(doc.id, userData.displayName || doc.id);
      });

      console.log('Users with display names:', userMap.size);

      const playerStats = new Map<string, PlayerStats>();

      // Process all games and aggregate player statistics
      gamesSnapshot.forEach((doc) => {
        try {
          const gameData = doc.data();
          const gameId = doc.id;
          console.log('Processing game:', gameId);

          // Skip invalid games
          if (!gameData.isClosed || !gameData.scores) {
            console.warn('Skipping invalid game:', gameId);
            return;
          }

          const scores = gameData.scores as Record<string, GameScore>;
          const gameStartTime = this.convertTimestampToDate(gameData.createdAt);

          // Process each player's score in the game
          Object.entries(scores).forEach(([playerId, scoreData]) => {
            try {
              const displayName = userMap.get(playerId);
              if (!displayName) {
                console.warn('No display name found for player:', playerId);
                return;
              }

              let currentStats = playerStats.get(playerId) || {
                displayName,
                gamesPlayed: 0,
                scores: [],
                bestScore: 0,
                bestGameId: '',
                lastPlayed: gameStartTime
              };

              // Process rounds
              if (scoreData.rounds) {
                const roundScores = Object.entries(scoreData.rounds)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([roundNum, score]) => {
                    // Calculate timestamp for each round (assume each round is ~5 minutes apart)
                    const roundTime = new Date(gameStartTime);
                    roundTime.setMinutes(roundTime.getMinutes() + (parseInt(roundNum) - 1) * 5);
                    return {
                      score,
                      timestamp: roundTime
                    };
                  });

                console.log('Processing rounds for player:', {
                  playerId,
                  displayName,
                  roundScores
                });

                if (roundScores.length > 0) {
                  // Add each round score with its timestamp
                  currentStats.scores.push(...roundScores);

                  // Update best score if any round score is higher
                  const maxRoundScore = Math.max(...roundScores.map(r => r.score));
                  if (maxRoundScore > currentStats.bestScore) {
                    currentStats.bestScore = maxRoundScore;
                    currentStats.bestGameId = gameId;
                  }

                  // Update games played and last played
                  currentStats.gamesPlayed++;
                  const lastRoundTime = roundScores[roundScores.length - 1].timestamp;
                  if (!currentStats.lastPlayed || lastRoundTime > currentStats.lastPlayed) {
                    currentStats.lastPlayed = lastRoundTime;
                  }
                }
              }

              playerStats.set(playerId, currentStats);
              console.log('Updated player stats:', {
                playerId,
                stats: currentStats
              });
            } catch (playerError) {
              console.error('Error processing player score:', playerId, playerError);
            }
          });
        } catch (gameError) {
          console.error('Error processing game:', doc.id, gameError);
        }
      });

      console.log('Final player stats:', Array.from(playerStats.entries()));

      // Convert Map to array and calculate averages
      const leaderboard = Array.from(playerStats.entries()).map(([playerId, stats]) => ({
        playerId,
        displayName: stats.displayName,
        gamesPlayed: stats.gamesPlayed,
        totalScore: stats.scores.reduce((sum, { score }) => sum + score, 0),
        averageScore: Math.round(
          stats.scores.reduce((sum, { score }) => sum + score, 0) / stats.scores.length
        ),
        bestScore: stats.bestScore,
        bestGameId: stats.bestGameId,
        lastPlayed: stats.lastPlayed,
        scoreHistory: stats.scores.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      }));

      console.log('Final leaderboard entries:', leaderboard);

      // Sort by best score descending
      return leaderboard.sort((a, b) => b.bestScore - a.bestScore);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }
} 