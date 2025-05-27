import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '@/shared/styles/animations';

interface ScoreEntryProps {
  onScoreSubmit: (scores: number[]) => void;
  isSubmitting?: boolean;
}

export function ScoreEntry({ onScoreSubmit, isSubmitting = false }: ScoreEntryProps) {
  const [scores, setScores] = useState<(number | null)[]>([null, null, null, null]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pointValues = ['2', '3', '4', '1'];

  const validateScore = (score: number | null, index: number): string | null => {
    if (score === null) return 'Score is required';
    if (score < 0) return 'Score cannot be negative';
    if (score > 20) return 'Maximum 20 discs per slot';
    if (!Number.isInteger(score)) return 'Score must be a whole number';
    return null;
  };

  const handleScoreChange = (index: number, value: string) => {
    const newValue = value === '' ? null : parseInt(value);
    const newScores = [...scores];
    newScores[index] = newValue;
    setScores(newScores);
    
    // Clear error for this slot
    const newErrors = [...errors];
    newErrors[index] = newValue !== null ? validateScore(newValue, index) || '' : '';
    setErrors(newErrors);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' && index < pointValues.length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < pointValues.length - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all scores
    const newErrors = scores.map((score, index) => validateScore(score, index) || '');
    setErrors(newErrors);

    if (newErrors.every(error => !error) && scores.every(score => score !== null)) {
      onScoreSubmit(scores as number[]);
      // Clear scores after submission
      setScores([null, null, null, null]);
      setErrors([]);
    }
  };

  // Calculate score breakdown
  const scoreBreakdown = (() => {
    const validScores = scores.filter(s => s !== null) as number[];
    if (validScores.length !== 4) return null;

    const completeSets = Math.min(...validScores);
    const completeSetPoints = completeSets * 20;
    
    const leftoverScores = validScores.map(score => score - completeSets);
    const leftoverPoints = leftoverScores.reduce((total, score, idx) => {
      const pointValue = parseInt(pointValues[idx]);
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
      {/* Score Entry Grid */}
      <div className="grid grid-cols-2 gap-4">
        {pointValues.map((points, index) => (
          <motion.div
            key={index}
            className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
              activeSlot === index
                ? 'border-blue-400 bg-blue-50/50 shadow-md'
                : errors[index]
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
            }`}
            variants={fadeIn}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <label
              htmlFor={`slot-${index}`}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {points} Point{parseInt(points) !== 1 ? 's' : ''} Slot
            </label>
            <input
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              id={`slot-${index}`}
              type="number"
              min="0"
              max="20"
              value={scores[index] ?? ''}
              onChange={(e) => handleScoreChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={() => setActiveSlot(index)}
              onBlur={() => setActiveSlot(null)}
              disabled={isSubmitting}
              className={`block w-full px-3 py-2 rounded-md text-lg text-center bg-white
                ${errors[index] 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }
                ${isSubmitting ? 'bg-gray-50 cursor-not-allowed' : ''}
                transition-colors duration-200`}
            />
            <AnimatePresence>
              {errors[index] && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 px-4 mt-1 text-xs text-red-600"
                >
                  {errors[index]}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 text-sm font-medium shadow-sm">
                {points}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Score Breakdown */}
      {scoreBreakdown && (
        <motion.div
          className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/30 border border-blue-100"
          variants={fadeIn}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Complete Sets ({scoreBreakdown.completeSets}x)</span>
              <span className="font-medium text-blue-700">+{scoreBreakdown.completeSetPoints}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Individual Points</span>
              <span className="font-medium text-blue-700">+{scoreBreakdown.leftoverPoints}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-blue-100">
              <span className="font-medium text-gray-700">Total Score</span>
              <span className="text-xl font-bold text-blue-700">{scoreBreakdown.total}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Submit Button */}
      <motion.button
        type="submit"
        onClick={handleSubmit}
        className="w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium text-white
          bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed shadow-sm
          transition-all duration-200"
        disabled={isSubmitting || !scores.every(score => score !== null) || errors.some(error => error)}
        variants={fadeIn}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        {isSubmitting ? (
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submitting...
          </div>
        ) : (
          'Submit Scores'
        )}
      </motion.button>

      {/* Help Text */}
      <motion.div
        className="text-center space-y-1"
        variants={fadeIn}
      >
        <p className="text-sm text-gray-500">Enter the number of discs in each scoring slot (max 20 per slot)</p>
        <p className="text-xs text-gray-400">Use arrow keys or Enter to navigate between slots</p>
      </motion.div>
    </motion.div>
  );
} 