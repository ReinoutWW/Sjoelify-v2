import { BaseEntity } from '@/shared/types';
import { SlotCounts } from '../games/types';

export interface PlayerStats extends BaseEntity {
  playerId: string;
  gamesPlayed: number;
  totalScore: number;
  averageScore: number;
  highestRoundScore: number;
  highestGameScore: number;
  slotAccuracy: Record<keyof SlotCounts, number>;
  recentScores: number[];  // Last 10 games
}

export interface TimeSeriesData {
  date: Date;
  value: number;
}

export interface PerformanceMetrics {
  averageScoreOverTime: TimeSeriesData[];
  slotAccuracyTrend: Array<{
    date: Date;
    accuracies: Record<keyof SlotCounts, number>;
  }>;
  personalBests: {
    singleRound: number;
    gameTotal: number;
    consecutiveBonus: number;
  };
}

export interface HeatmapData {
  slotId: keyof SlotCounts;
  successRate: number;
  totalAttempts: number;
} 