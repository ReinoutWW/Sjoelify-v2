'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Game } from '../types';
import { fadeIn, staggerChildren } from '@/shared/styles/animations';
import { UserCircleIcon } from '@heroicons/react/24/solid';

interface PlayerStats {
  playerId: string;
  displayName: string;
  rounds: { [key: number]: number };
  totalScore: number;
  averageScore: number;
  bestRound: number;
  worstRound: number;
}

interface GameSummaryProps {
  game: Game;
}

export function GameSummary({ game }: GameSummaryProps) {
  // Calculate player statistics
  const playerStats = useMemo(() => {
    return game.players.map(player => {
      const playerScores = game.scores[player.id];
      const rounds = playerScores?.rounds || {};
      const roundScores = Object.values(rounds);
      
      return {
        playerId: player.id,
        displayName: player.displayName,
        rounds,
        totalScore: playerScores?.total || 0,
        averageScore: roundScores.length > 0 
          ? Math.round(roundScores.reduce((a, b) => a + b, 0) / roundScores.length) 
          : 0,
        bestRound: roundScores.length > 0 ? Math.max(...roundScores) : 0,
        worstRound: roundScores.length > 0 ? Math.min(...roundScores) : 0,
      } as PlayerStats;
    }).sort((a, b) => b.totalScore - a.totalScore); // Sort by total score
  }, [game]);

  // Find overall statistics
  const gameStats = useMemo(() => {
    const allScores = playerStats.flatMap(player => Object.values(player.rounds));
    return {
      highestScore: Math.max(...allScores),
      lowestScore: Math.min(...allScores),
      overallAverage: Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length),
      winner: playerStats[0], // Already sorted by total score
      bestAveragePlayer: [...playerStats].sort((a, b) => b.averageScore - a.averageScore)[0],
      bestSingleRoundPlayer: [...playerStats].sort((a, b) => b.bestRound - a.bestRound)[0],
    };
  }, [playerStats]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
      className="space-y-8"
    >
      {/* Game Overview Cards */}
      <motion.div
        variants={fadeIn}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Winner Card */}
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 shadow-sm border border-amber-100">
          <h3 className="text-amber-800 text-sm font-medium mb-1">Winner</h3>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <UserCircleIcon className="h-8 w-8 text-amber-400" />
              <p className="text-2xl font-bold text-amber-900 truncate">{gameStats.winner.displayName}</p>
            </div>
            <p className="text-amber-700 mt-1">Total Score: {gameStats.winner.totalScore}</p>
          </div>
        </div>

        {/* Best Round Card */}
        <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-6 shadow-sm border border-primary-100">
          <h3 className="text-primary-800 text-sm font-medium mb-1">Best Single Round</h3>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <UserCircleIcon className="h-8 w-8 text-primary-400" />
              <div>
                <p className="text-2xl font-bold text-primary-900">
                  {gameStats.bestSingleRoundPlayer.bestRound} points
                </p>
                <p className="text-primary-700 truncate">by {gameStats.bestSingleRoundPlayer.displayName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Best Average Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 shadow-sm border border-emerald-100">
          <h3 className="text-emerald-800 text-sm font-medium mb-1">Best Average</h3>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <UserCircleIcon className="h-8 w-8 text-emerald-400" />
              <div>
                <p className="text-2xl font-bold text-emerald-900">
                  {gameStats.bestAveragePlayer.averageScore} points
                </p>
                <p className="text-emerald-700 truncate">by {gameStats.bestAveragePlayer.displayName}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Detailed Scores Table */}
      <motion.div
        variants={fadeIn}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Round
                </th>
                {playerStats.map((player) => (
                  <th
                    key={player.playerId}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]"
                  >
                    <div className="truncate">{player.displayName}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.from({ length: 5 }, (_, roundIndex) => (
                <tr key={roundIndex + 1} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                    <div className="flex items-center">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-gray-600">
                        {roundIndex + 1}
                      </span>
                    </div>
                  </td>
                  {playerStats.map((player) => {
                    const score = player.rounds[roundIndex + 1];
                    const isHighestInRound = score === Math.max(
                      ...playerStats.map(p => p.rounds[roundIndex + 1] || 0)
                    );
                    
                    return (
                      <td
                        key={player.playerId}
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isHighestInRound
                            ? 'font-bold text-primary-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {score || '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Summary rows */}
              <tr className="bg-gray-50 font-medium">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Average
                </td>
                {playerStats.map((player) => (
                  <td
                    key={player.playerId}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {player.averageScore}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50 font-medium">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Total
                </td>
                {playerStats.map((player) => (
                  <td
                    key={player.playerId}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      player.totalScore === gameStats.winner.totalScore
                        ? 'font-bold text-primary-600'
                        : 'text-gray-900'
                    }`}
                  >
                    {player.totalScore}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Player Performance Cards */}
      <motion.div
        variants={fadeIn}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {playerStats.map((player) => (
          <div
            key={player.playerId}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <UserCircleIcon className="h-6 w-6 text-gray-400" />
                <h3 className="font-medium text-gray-900 truncate">{player.displayName}</h3>
              </div>
              <dl className="mt-3 space-y-2">
                <div className="flex justify-between items-center gap-2">
                  <dt className="text-sm text-gray-500 truncate">Best Round</dt>
                  <dd className="text-sm font-medium text-gray-900">{player.bestRound}</dd>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <dt className="text-sm text-gray-500 truncate">Worst Round</dt>
                  <dd className="text-sm font-medium text-gray-900">{player.worstRound}</dd>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <dt className="text-sm text-gray-500 truncate">Average</dt>
                  <dd className="text-sm font-medium text-gray-900">{player.averageScore}</dd>
                </div>
                <div className="flex justify-between items-center gap-2 pt-2 border-t border-gray-100">
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Score</dt>
                  <dd className="text-sm font-bold text-primary-600">{player.totalScore}</dd>
                </div>
              </dl>
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
} 