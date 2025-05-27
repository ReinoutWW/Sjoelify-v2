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
    }
  };

  const totalScore = scores.reduce<number>((acc, score, index) => {
    if (score === null) return acc;
    
    // Calculate complete sets
    const validScores = scores.filter(s => s !== null) as number[];
    if (validScores.length === 4) {
      const completeSets = Math.min(...validScores);
      const completeSetPoints = completeSets * 20;
      
      // Calculate leftover points
      const leftoverScores = validScores.map(score => score - completeSets);
      const leftoverPoints = leftoverScores.reduce((total, score, idx) => {
        const pointValue = idx === 0 ? 2 : // First gate (2 points)
                          idx === 1 ? 3 : // Second gate (3 points)
                          idx === 2 ? 4 : // Third gate (4 points)
                          1;                // Fourth gate (1 point)
        return total + (score * pointValue);
      }, 0);

      return completeSetPoints + leftoverPoints;
    }

    // If not all scores are entered yet, show simple calculation
    const pointValue = index === 0 ? 2 : // First gate (2 points)
                      index === 1 ? 3 : // Second gate (3 points)
                      index === 2 ? 4 : // Third gate (4 points)
                      1;                // Fourth gate (1 point)
    return acc + (score * pointValue);
  }, 0);

  // Calculate score breakdown for display
  const scoreBreakdown = (() => {
    if (!scores.every(score => score !== null)) return null;
    
    const validScores = scores as number[];
    const completeSets = Math.min(...validScores);
    const completeSetPoints = completeSets * 20;
    
    const leftoverScores = validScores.map(score => score - completeSets);
    const leftoverPoints = leftoverScores.reduce((total, score, idx) => {
      const pointValue = idx === 0 ? 2 : 
                        idx === 1 ? 3 : 
                        idx === 2 ? 4 : 
                        1;
      return total + (score * pointValue);
    }, 0);

    return {
      completeSets,
      completeSetPoints,
      leftoverPoints
    };
  })();

  return (
    <motion.form
      className="space-y-4 sm:space-y-6"
      onSubmit={handleSubmit}
      variants={fadeIn}
      initial="hidden"
      animate="visible"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {pointValues.map((points, index) => (
          <motion.div
            key={index}
            className={`relative p-3 sm:p-4 rounded-lg border-2 transition-colors duration-200 ${
              activeSlot === index
                ? 'border-primary-500 bg-primary-50'
                : errors[index]
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 hover:border-primary-300'
            }`}
            variants={fadeIn}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <label
              htmlFor={`slot-${index}`}
              className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
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
              aria-invalid={!!errors[index]}
              aria-describedby={errors[index] ? `error-${index}` : undefined}
              className={`block w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-md border-gray-300 
                focus:ring-primary-500 focus:border-primary-500 
                text-base sm:text-lg text-center text-gray-900 transition-colors duration-200
                ${errors[index] ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
                ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            <AnimatePresence>
              {errors[index] && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 px-3 sm:px-4 mt-1"
                >
                  <p id={`error-${index}`} className="text-xs text-red-600">
                    {errors[index]}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-primary-100 text-primary-800 text-xs sm:text-sm font-medium">
                {points}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div
        className="flex flex-col space-y-2 p-3 sm:p-4 bg-gray-50 rounded-lg"
        variants={fadeIn}
      >
        {scoreBreakdown ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-500">Complete Sets ({scoreBreakdown.completeSets}x)</span>
              <span className="text-sm sm:text-base font-medium text-primary-600">+{scoreBreakdown.completeSetPoints}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-500">Leftover Points</span>
              <span className="text-sm sm:text-base font-medium text-primary-600">+{scoreBreakdown.leftoverPoints}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-sm sm:text-base font-medium text-gray-700">Total Score</span>
              <span className="text-xl sm:text-2xl font-bold text-primary-600">{totalScore}</span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-gray-500">Total Score</span>
            <span className="text-xl sm:text-2xl font-bold text-primary-600">{totalScore}</span>
          </div>
        )}
      </motion.div>
      <motion.button
        type="submit"
        className="w-full flex items-center justify-center px-4 py-2.5 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        disabled={isSubmitting || !scores.every(score => score !== null) || errors.some(error => error)}
        variants={fadeIn}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isSubmitting ? (
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submitting...
          </div>
        ) : (
          'Submit Scores'
        )}
      </motion.button>
      <motion.div
        className="text-xs sm:text-sm text-gray-500 text-center mt-3 sm:mt-4"
        variants={fadeIn}
      >
        <p>Enter the number of discs in each scoring slot (max 20 per slot)</p>
        <p className="mt-1 text-xs text-gray-400">Use arrow keys or Enter to navigate between slots</p>
      </motion.div>
    </motion.form>
  );
} 