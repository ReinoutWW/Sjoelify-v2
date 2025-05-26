import { BaseEntity } from '@/shared/types';
import { UserProfile } from '../account/types';

export interface SlotCounts {
  slot1: number;  // 1-point slot
  slot2: number;  // 2-point slot
  slot3: number;  // 3-point slot
  slot4: number;  // 4-point slot
}

export interface Round extends BaseEntity {
  gameId: string;
  playerId: string;
  roundNumber: number;
  throws: SlotCounts[];  // Array of 3 throws
  score: number;  // Calculated score including bonuses
}

export interface Game extends BaseEntity {
  id: string;
  title: string;
  createdBy: string;
  playerIds: string[];
  players: UserProfile[];
  currentRound: number;
  isClosed: boolean;
  createdAt: Date;
  updatedAt: Date;
  scores: Record<string, PlayerScore>;
  rounds?: Round[];
}

export interface GameSummary {
  gameId: string;
  title: string;
  date: Date;
  players: string[];
  winner: string;
  topScore: number;
}

export interface GameStats {
  totalGames: number;
  averageScore: number;
  highestScore: number;
  totalRounds: number;
  slotAccuracy: Record<keyof SlotCounts, number>;
}

export interface PlayerScore {
  total: number;
  rounds: Record<number, number>;
} 