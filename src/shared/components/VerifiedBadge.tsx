'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface VerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

export function VerifiedBadge({ size = 'sm', className = '', showTooltip = true }: VerifiedBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation();
  
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className={`${sizeClasses[size]} relative cursor-pointer`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Octagon background shape - subtle light blue */}
          <path
            d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2z"
            fill="rgb(147, 197, 253)" /* bg-blue-300 */
            className="opacity-90"
          />
          {/* Checkmark - white */}
          <path
            d="M9 12l2 2 4-4"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        
        {/* Tooltip */}
        {showTooltip && isHovered && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded pointer-events-none whitespace-nowrap z-10"
          >
            {t.common.verified}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
} 