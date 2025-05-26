import { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeIn } from '@/shared/styles/animations';

interface ScoreEntryProps {
  onScoreSubmit: (scores: number[]) => void;
}

export function ScoreEntry({ onScoreSubmit }: ScoreEntryProps) {
  const [scores, setScores] = useState<(number | null)[]>([null, null, null, null]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const pointValues = ['2', '3', '4', '1'];

  const handleScoreChange = (index: number, value: string) => {
    const newValue = value === '' ? null : parseInt(value);
    const newScores = [...scores];
    newScores[index] = newValue;
    setScores(newScores);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scores.every(score => score !== null)) {
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
              id={`slot-${index}`}
              type="number"
              min="0"
              max="20"
              value={scores[index] || ''}
              onChange={(e) => handleScoreChange(index, e.target.value)}
              onFocus={() => setActiveSlot(index)}
              onBlur={() => setActiveSlot(null)}
              className="block w-full px-3 py-2 rounded-md border-gray-300 focus:ring-primary-500 focus:border-primary-500 text-lg text-center"
            />
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
        disabled={!scores.every(score => score !== null)}
        variants={fadeIn}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Submit Scores
      </motion.button>
      <motion.div
        className="text-sm text-gray-500 text-center mt-4"
        variants={fadeIn}
      >
        Enter the number of discs in each scoring slot (max 20 per slot)
      </motion.div>
    </motion.form>
  );
} 