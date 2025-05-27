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
    }
  };

  const totalScore = scores.reduce<number>((acc, score, index) => {
    if (score === null) return acc;
    return acc + score * parseInt(pointValues[index]);
  }, 0);

  return (
    <motion.form
      className="space-y-6"
      onSubmit={handleSubmit}
      variants={fadeIn}
      initial="hidden"
      animate="visible"
    >
      <div className="grid grid-cols-2 gap-4">
        {pointValues.map((points, index) => (
          <motion.div
            key={index}
            className={`relative p-4 rounded-lg border-2 transition-colors duration-200 ${
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
              aria-invalid={!!errors[index]}
              aria-describedby={errors[index] ? `error-${index}` : undefined}
              className={`block w-full px-3 py-2 rounded-md border-gray-300 
                focus:ring-primary-500 focus:border-primary-500 
                text-lg text-center transition-colors duration-200
                ${errors[index] ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
                ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            <AnimatePresence>
              {errors[index] && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 px-4 mt-1"
                >
                  <p id={`error-${index}`} className="text-xs text-red-600">
                    {errors[index]}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-primary-800 text-sm font-medium">
                {points}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div
        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
        variants={fadeIn}
      >
        <span className="text-sm font-medium text-gray-500">Total Score</span>
        <span className="text-2xl font-bold text-primary-600">{totalScore}</span>
      </motion.div>
      <motion.button
        type="submit"
        className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        disabled={isSubmitting || !scores.every(score => score !== null) || errors.some(error => error)}
        variants={fadeIn}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isSubmitting ? (
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
        className="text-sm text-gray-500 text-center mt-4"
        variants={fadeIn}
      >
        <p>Enter the number of discs in each scoring slot (max 20 per slot)</p>
        <p className="mt-1 text-xs text-gray-400">Use arrow keys or Enter to navigate between slots</p>
      </motion.div>
    </motion.form>
  );
} 