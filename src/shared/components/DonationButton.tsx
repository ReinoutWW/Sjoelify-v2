'use client';

import { motion } from 'framer-motion';

interface DonationButtonProps {
  variant?: 'small' | 'medium' | 'large';
  className?: string;
}

export function DonationButton({ variant = 'medium', className = '' }: DonationButtonProps) {
  const sizes = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg',
  };

  return (
    <motion.a
      href="https://www.paypal.com/donate/?hosted_button_id=UEE7BDUYN7AUS"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 ${sizes[variant]} bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-full transition-all hover:shadow-md font-medium ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="text-xl">☕</span>
      <span>Steun ons met een koffie</span>
    </motion.a>
  );
} 