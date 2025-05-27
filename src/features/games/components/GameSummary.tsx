'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Game } from '../types';
import { fadeIn, staggerChildren } from '@/shared/styles/animations';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { formatDate, isFirestoreTimestamp } from '@/shared/utils/date-utils';

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

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
      {/* Game Title */}
      <motion.div
        variants={fadeIn}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-primary-600">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM9 7.5A.75.75 0 009 9h1.5c.184 0 .355.097.448.257L12 10.5l1.052-1.243A.5.5 0 0113.5 9H15a.75.75 0 000-1.5H9Zm-1.5 6.44 2.72-2.72a.75.75 0 011.06 0l2.72 2.72a.75.75 0 11-1.06 1.06L12 13.06l-.97.97a.75.75 0 01-1.06 0l-.97-.97-.53.53a.75.75 0 01-1.06-1.06Z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{game.title}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Game Summary</span>
              <span>•</span>
              <time dateTime={formatDate(game.createdAt)}>
                {formatDate(game.createdAt)}
              </time>
            </div>
          </div>
        </div>
        {!game.isClosed && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
            Round {game.currentRound}/5
          </span>
        )}
      </motion.div>

      {/* Winner Section */}
      <motion.div
        variants={fadeIn}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-50/50 to-yellow-50/50 p-8"
      >
        <div 
          className="absolute inset-0 bg-gradient-to-r from-amber-100/20 to-yellow-100/20"
          style={{
            maskImage: 'radial-gradient(circle at top left, transparent 0%, black 100%)'
          }}
        />
        <div className="relative flex items-center gap-4">
          <div className="flex-shrink-0">
            <UserCircleIcon className="h-14 w-14 text-amber-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-amber-900 truncate">{gameStats.winner.displayName}</h2>
              <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-0.5 text-sm font-medium text-amber-800 border border-amber-200">
                Winner
              </span>
            </div>
            <p className="text-amber-600">Total Score: {gameStats.winner.totalScore}</p>
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
        {playerStats.map((player) => {
          const isBestRound = player.playerId === gameStats.bestSingleRoundPlayer.playerId;
          const isBestAverage = player.playerId === gameStats.bestAveragePlayer.playerId;
          
          return (
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
                    <dd className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      {isBestRound && (
                        <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 border border-primary-100">
                          Best
                        </span>
                      )}
                      {player.bestRound}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <dt className="text-sm text-gray-500 truncate">Average</dt>
                    <dd className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      {isBestAverage && (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-100">
                          Best
                        </span>
                      )}
                      {player.averageScore}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <dt className="text-sm text-gray-500 truncate">Worst Round</dt>
                    <dd className="text-sm font-medium text-gray-900">{player.worstRound}</dd>
                  </div>
                  <div className="flex justify-between items-center gap-2 pt-2 border-t border-gray-100">
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Score</dt>
                    <dd className="text-sm font-bold text-primary-600">{player.totalScore}</dd>
                  </div>
                </dl>
              </div>
            </div>
          );
        })}
      </motion.div>
    </motion.div>
  );
} 