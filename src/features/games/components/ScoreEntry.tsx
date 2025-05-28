import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '@/shared/styles/animations';

interface ScoreEntryProps {
  onScoreSubmit: (scores: number[]) => void;
  isSubmitting?: boolean;
}

export function ScoreEntry({ onScoreSubmit, isSubmitting = false }: ScoreEntryProps) {
  const [scores, setScores] = useState<number[]>([0, 0, 0, 0]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const MAX_TOTAL_DISCS = 30;
  
  const gates = [
    { points: '2', dots: 2 },
    { points: '3', dots: 3 },
    { points: '4', dots: 4 },
    { points: '1', dots: 1 },
  ];

  const getTotalDiscs = (currentScores: number[]) => currentScores.reduce((sum, score) => sum + score, 0);

  const handleScoreChange = (index: number, increment: boolean = true) => {
    if (isSubmitting) return;
    
    const newScores = [...scores];
    const currentTotal = getTotalDiscs(scores);

    if (increment) {
      if (currentTotal >= MAX_TOTAL_DISCS) {
        setError(`Maximum of ${MAX_TOTAL_DISCS} discs reached`);
        return;
      }
      newScores[index]++;
      setError(null);
    } else if (!increment && newScores[index] > 0) {
      newScores[index]--;
      setError(null);
    }
    setScores(newScores);
  };

  const handleInputChange = (index: number, value: string) => {
    const newValue = Math.max(0, parseInt(value) || 0);
    const newScores = [...scores];
    newScores[index] = newValue;

    const newTotal = getTotalDiscs(newScores);
    if (newTotal > MAX_TOTAL_DISCS) {
      setError(`Maximum of ${MAX_TOTAL_DISCS} discs reached`);
      return;
    }

    setError(null);
    setScores(newScores);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, index: number) => {
    if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleScoreChange(index, true);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleScoreChange(index, false);
    } else if (e.key === 'ArrowRight' && index < gates.length - 1) {
      const nextElement = document.getElementById(`gate-${index + 1}`);
      nextElement?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      const prevElement = document.getElementById(`gate-${index - 1}`);
      prevElement?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onScoreSubmit(scores);
    setScores([0, 0, 0, 0]);
  };

  // Calculate score breakdown
  const scoreBreakdown = (() => {
    const completeSets = Math.min(...scores);
    const completeSetPoints = completeSets * 20;
    
    const leftoverScores = scores.map(score => score - completeSets);
    const leftoverPoints = leftoverScores.reduce((total, score, idx) => {
      const pointValue = parseInt(gates[idx].points);
      return total + (score * pointValue);
    }, 0);

    return {
      completeSets,
      completeSetPoints,
      leftoverPoints,
      total: completeSetPoints + leftoverPoints
    };
  })();

  return (
    <motion.div
      className="space-y-6"
      variants={fadeIn}
      initial="hidden"
      animate="visible"
    >
      {/* Score Entry Row */}
      <div>
        <div className="mb-4">
          <h3 className="text-base font-medium text-gray-900">Enter Discs per Gate</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-1">
            <p className="text-sm text-gray-500">Count discs from left to right</p>
            <div className="flex-1 hidden sm:block" />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-amber-500">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-medium text-amber-800">{error}</span>
                </motion.div>
              )}
              <p className="text-sm text-gray-500 text-right min-w-[90px] ml-auto sm:ml-0">
                {getTotalDiscs(scores)}/{MAX_TOTAL_DISCS} discs used
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {gates.map((gate, index) => (
            <motion.div
              key={index}
              id={`gate-${index}`}
              tabIndex={0}
              className={`relative p-3 sm:p-4 rounded-lg border-2 transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                activeSlot === index
                  ? 'border-blue-400 bg-blue-50/50 shadow-md focus:ring-blue-500'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 focus:ring-blue-400'
              }`}
              variants={fadeIn}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onFocus={() => setActiveSlot(index)}
              onBlur={() => setActiveSlot(null)}
            >
              <div className="flex flex-col items-center space-y-3">
                {/* Gate identifier dots */}
                <div className="flex items-center justify-center gap-1 py-1">
                  {Array.from({ length: gate.dots }).map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-blue-300"
                    />
                  ))}
                </div>
                {/* Score input */}
                <div className="relative w-full">
                  <input
                    type="number"
                    min="0"
                    value={scores[index]}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    className="block w-full px-2 py-2 sm:py-1 text-center rounded-md text-blue-600 font-medium bg-blue-50 border-2 border-blue-100
                      focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300
                      [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleScoreChange(index, true);
                    }}
                    disabled={isSubmitting || getTotalDiscs(scores) >= MAX_TOTAL_DISCS}
                    className="absolute inset-y-0 right-0 flex items-center pr-1.5 text-blue-500 hover:text-blue-600 disabled:text-blue-300 disabled:cursor-not-allowed p-0.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleScoreChange(index, false);
                    }}
                    disabled={scores[index] <= 0 || isSubmitting}
                    className="absolute inset-y-0 left-0 flex items-center pl-1.5 text-blue-500 hover:text-blue-600 disabled:text-blue-300 disabled:cursor-not-allowed p-0.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25-4.5a.75.75 0 01-1.08 0l-4.25 4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Click the arrows or use up/down keys to adjust the score
        </p>
      </div>

      {/* Score Breakdown */}
      {scores.every(score => score > 0) && (
        <motion.div
          className="p-3 sm:p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/30 border border-blue-100"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Complete Sets ({scoreBreakdown.completeSets}x)</span>
              <span className="font-medium text-blue-700">+{scoreBreakdown.completeSetPoints}</span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Individual Points</span>
              <span className="font-medium text-blue-700">+{scoreBreakdown.leftoverPoints}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-blue-100">
              <span className="font-medium text-gray-700">Total Score</span>
              <span className="text-lg sm:text-xl font-bold text-blue-700">{scoreBreakdown.total}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Submit Button */}
      <motion.button
        type="submit"
        onClick={handleSubmit}
        className="w-full flex items-center justify-center px-4 py-2.5 sm:py-3 rounded-lg font-medium text-white
          bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed shadow-sm
          transition-all duration-200"
        disabled={isSubmitting}
        variants={fadeIn}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        Submit Scores
      </motion.button>
    </motion.div>
  );
} 