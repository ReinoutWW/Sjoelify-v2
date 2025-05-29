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
  relativeScore: number;
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
  scores: Array<{
    score: number;
    timestamp: Date;
    relativeScore: number;
  }>;
  bestScore: number;
  bestGameId: string;
  lastPlayed: Date;
  bestAverageInGame: number;
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
  bestAverageInGame: number;
  verified?: boolean;
  scoreHistory: Array<{
    score: number;
    timestamp: Date;
    relativeScore: number;
  }>;
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

  private static getBestAverageScore(leaderboard: LeaderboardEntry[]): number {
    if (leaderboard.length === 0) return 0;
    const bestAverage = Math.max(...leaderboard.map(entry => entry.bestAverageInGame));
    console.log('Calculating best average across all players:', {
      allAverages: leaderboard.map(entry => ({
        player: entry.displayName,
        bestAverageInGame: entry.bestAverageInGame
      })),
      overallBest: bestAverage
    });
    return bestAverage;
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

      const usersQuery = query(collection(db, this.usersCollection));
      
      const [gamesSnapshot, usersSnapshot] = await Promise.all([
        getDocs(gamesQuery),
        getDocs(usersQuery)
      ]);

      if (gamesSnapshot.size === 0 || usersSnapshot.size === 0) {
        console.log('No games or users found');
        return [];
      }

      // Create a map of user IDs to display names
      const userMap = new Map<string, string>();
      const verifiedMap = new Map<string, boolean>();
      usersSnapshot.forEach(doc => {
        const userData = doc.data() as UserProfile;
        userMap.set(doc.id, userData.displayName || doc.id);
        verifiedMap.set(doc.id, userData.verified || false);
      });

      const playerStats = new Map<string, PlayerStats>();

      // First pass: Calculate best averages for each player
      gamesSnapshot.docs.forEach(doc => {
        const gameData = doc.data() as Game;
        const scores = gameData.scores || {};

        Object.entries(scores).forEach(([playerId, scoreData]) => {
          if (!scoreData.rounds) return;

          const roundScores = Object.values(scoreData.rounds);
          if (roundScores.length === 0) return;

          const gameAverage = Math.round(
            roundScores.reduce((sum, score) => sum + score, 0) / roundScores.length
          );

          const currentStats = playerStats.get(playerId) || {
            displayName: userMap.get(playerId) || playerId,
            gamesPlayed: 0,
            scores: [],
            bestScore: 0,
            bestGameId: '',
            lastPlayed: new Date(),
            bestAverageInGame: 0
          };

          if (gameAverage > currentStats.bestAverageInGame) {
            currentStats.bestAverageInGame = gameAverage;
          }

          playerStats.set(playerId, currentStats);
        });
      });

      // Second pass: Calculate relative scores against player's own best score
      gamesSnapshot.docs.forEach(doc => {
        const gameData = doc.data() as Game;
        const gameId = doc.id;
        const scores = gameData.scores || {};
        const gameTime = this.convertTimestampToDate(gameData.updatedAt);

        Object.entries(scores).forEach(([playerId, scoreData]) => {
          if (!scoreData.rounds) return;

          const playerStat = playerStats.get(playerId);
          if (!playerStat) return;

          const roundScores = Object.entries(scoreData.rounds)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([roundNum, score]) => {
              const roundTime = new Date(gameTime);
              roundTime.setMinutes(roundTime.getMinutes() + (parseInt(roundNum) - 1) * 5);
              
              // Calculate relative score against player's best score
              const relativeScore = score - playerStat.bestScore;

              return {
                score,
                timestamp: roundTime,
                relativeScore
              };
            });

          playerStat.scores.push(...roundScores);
          playerStat.gamesPlayed++;

          // Update best score if any round score is higher
          const maxRoundScore = Math.max(...roundScores.map(r => r.score));
          if (maxRoundScore > playerStat.bestScore) {
            playerStat.bestScore = maxRoundScore;
            playerStat.bestGameId = gameId;
          }

          // Update last played time
          const lastRoundTime = roundScores[roundScores.length - 1].timestamp;
          if (!playerStat.lastPlayed || lastRoundTime > playerStat.lastPlayed) {
            playerStat.lastPlayed = lastRoundTime;
          }
        });
      });

      // Convert to leaderboard entries
      const allEntries = Array.from(playerStats.entries()).map(([playerId, stats]: [string, PlayerStats]): LeaderboardEntry => ({
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
        bestAverageInGame: stats.bestAverageInGame,
        verified: verifiedMap.get(playerId) || false,
        scoreHistory: stats.scores.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      }));

      // Filter to only show verified users and sort by best average in game descending
      const leaderboard = allEntries
        .filter(entry => entry.verified)
        .sort((a, b) => b.bestAverageInGame - a.bestAverageInGame);

      return leaderboard;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  static async getAllPlayers(): Promise<LeaderboardEntry[]> {
    try {
      console.log('Starting all players fetch...');

      // Get all completed games
      const gamesQuery = query(
        collection(db, this.gamesCollection),
        where('isClosed', '==', true),
        orderBy('updatedAt', 'desc')
      );

      const usersQuery = query(collection(db, this.usersCollection));
      
      const [gamesSnapshot, usersSnapshot] = await Promise.all([
        getDocs(gamesQuery),
        getDocs(usersQuery)
      ]);

      if (gamesSnapshot.size === 0 || usersSnapshot.size === 0) {
        console.log('No games or users found');
        return [];
      }

      // Create a map of user IDs to display names
      const userMap = new Map<string, string>();
      const verifiedMap = new Map<string, boolean>();
      usersSnapshot.forEach(doc => {
        const userData = doc.data() as UserProfile;
        userMap.set(doc.id, userData.displayName || doc.id);
        verifiedMap.set(doc.id, userData.verified || false);
      });

      const playerStats = new Map<string, PlayerStats>();

      // First pass: Calculate best averages for each player
      gamesSnapshot.docs.forEach(doc => {
        const gameData = doc.data() as Game;
        const scores = gameData.scores || {};

        Object.entries(scores).forEach(([playerId, scoreData]) => {
          if (!scoreData.rounds) return;

          const roundScores = Object.values(scoreData.rounds);
          if (roundScores.length === 0) return;

          const gameAverage = Math.round(
            roundScores.reduce((sum, score) => sum + score, 0) / roundScores.length
          );

          const currentStats = playerStats.get(playerId) || {
            displayName: userMap.get(playerId) || playerId,
            gamesPlayed: 0,
            scores: [],
            bestScore: 0,
            bestGameId: '',
            lastPlayed: new Date(),
            bestAverageInGame: 0
          };

          if (gameAverage > currentStats.bestAverageInGame) {
            currentStats.bestAverageInGame = gameAverage;
          }

          playerStats.set(playerId, currentStats);
        });
      });

      // Second pass: Calculate relative scores against player's own best score
      gamesSnapshot.docs.forEach(doc => {
        const gameData = doc.data() as Game;
        const gameId = doc.id;
        const scores = gameData.scores || {};
        const gameTime = this.convertTimestampToDate(gameData.updatedAt);

        Object.entries(scores).forEach(([playerId, scoreData]) => {
          if (!scoreData.rounds) return;

          const playerStat = playerStats.get(playerId);
          if (!playerStat) return;

          const roundScores = Object.entries(scoreData.rounds)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([roundNum, score]) => {
              const roundTime = new Date(gameTime);
              roundTime.setMinutes(roundTime.getMinutes() + (parseInt(roundNum) - 1) * 5);
              
              // Calculate relative score against player's best score
              const relativeScore = score - playerStat.bestScore;

              return {
                score,
                timestamp: roundTime,
                relativeScore
              };
            });

          playerStat.scores.push(...roundScores);
          playerStat.gamesPlayed++;

          // Update best score if any round score is higher
          const maxRoundScore = Math.max(...roundScores.map(r => r.score));
          if (maxRoundScore > playerStat.bestScore) {
            playerStat.bestScore = maxRoundScore;
            playerStat.bestGameId = gameId;
          }

          // Update last played time
          const lastRoundTime = roundScores[roundScores.length - 1].timestamp;
          if (!playerStat.lastPlayed || lastRoundTime > playerStat.lastPlayed) {
            playerStat.lastPlayed = lastRoundTime;
          }
        });
      });

      // Convert to leaderboard entries
      const allEntries = Array.from(playerStats.entries()).map(([playerId, stats]: [string, PlayerStats]): LeaderboardEntry => ({
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
        bestAverageInGame: stats.bestAverageInGame,
        verified: verifiedMap.get(playerId) || false,
        scoreHistory: stats.scores.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      }));

      // Return all players sorted by best average in game descending
      return allEntries.sort((a, b) => b.bestAverageInGame - a.bestAverageInGame);
    } catch (error) {
      console.error('Error fetching all players:', error);
      throw error;
    }
  }
} 