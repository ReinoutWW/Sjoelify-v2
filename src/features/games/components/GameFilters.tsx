import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, XMarkIcon, FunnelIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { Game } from '../types';

interface GameFilter {
  type: 'search' | 'date';
  value: string;
  label: string;
}

interface GameFiltersProps {
  onFiltersChange: (games: Game[]) => void;
  games: Game[];
}

const getDateFromFirestore = (dateString: any): Date | null => {
  try {
    // Handle Firestore Timestamp
    if (typeof dateString === 'object' && dateString !== null && 'seconds' in dateString && typeof dateString.seconds === 'number') {
      const date = new Date(dateString.seconds * 1000);
      return isNaN(date.getTime()) ? null : date;
    }
    
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error('Error converting date:', error);
    return null;
  }
};

const isSameDay = (date1: Date | null, date2: Date | null): boolean => {
  if (!date1 || !date2) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export function GameFilters({ onFiltersChange, games }: GameFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<GameFilter[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Memoize the filter function to prevent unnecessary recalculations
  const applyFilters = useCallback(() => {
    const filteredGames = games.filter(game => {
      return activeFilters.every(filter => {
        if (filter.type === 'search') {
          return game.title.toLowerCase().includes(filter.value.toLowerCase());
        }
        if (filter.type === 'date') {
          const filterDate = new Date(filter.value);
          const gameDate = getDateFromFirestore(game.createdAt);
          return isSameDay(filterDate, gameDate);
        }
        return true;
      });
    });
    onFiltersChange(filteredGames);
  }, [activeFilters, games, onFiltersChange]);

  // Apply filters whenever activeFilters or games change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const addFilter = (type: 'search' | 'date', value: string) => {
    if (!value) return;
    
    let label = value;
    if (type === 'date') {
      const date = new Date(value);
      label = `Date: ${date.toLocaleDateString()}`;
    } else {
      label = `Search: ${value}`;
    }

    setActiveFilters(prev => [...prev, { type, value, label }]);
    setSearchTerm('');
    setShowDatePicker(false);
  };

  const removeFilter = (index: number) => {
    setActiveFilters(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm) {
      addFilter('search', searchTerm);
    }
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 placeholder-gray-500"
            placeholder="Search games..."
          />
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
          Date
        </motion.button>

        {searchTerm && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => addFilter('search', searchTerm)}
            className="inline-flex items-center px-3 py-2 border border-primary-300 shadow-sm text-sm font-medium rounded-lg text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Add Filter
          </motion.button>
        )}
      </div>

      {showDatePicker && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="relative"
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                onChange={(e) => addFilter('date', e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm 
                  focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 
                  sm:text-sm text-gray-900
                  [&::-webkit-calendar-picker-indicator]:bg-transparent
                  [&::-webkit-calendar-picker-indicator]:hover:cursor-pointer"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDatePicker(false)}
              className="inline-flex items-center justify-center p-2 border border-gray-300 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-50"
            >
              <XMarkIcon className="h-5 w-5" />
            </motion.button>
          </div>
        </motion.div>
      )}

      {activeFilters.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-2"
        >
          <AnimatePresence>
            {activeFilters.map((filter, index) => (
              <motion.span
                key={`${filter.type}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-700 border border-primary-100"
              >
                {filter.label}
                <button
                  onClick={() => removeFilter(index)}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-primary-200 focus:outline-none"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
} 