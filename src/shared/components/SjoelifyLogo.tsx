'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';

interface SjoelifyLogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export function SjoelifyLogo({ className = '', size = 'medium' }: SjoelifyLogoProps) {
  const { user } = useAuth();
  
  // Define sizes for different variants
  const sizes = {
    small: { width: 100, height: 34 },
    medium: { width: 120, height: 40 },
    large: { width: 180, height: 60 }
  };

  const { width, height } = sizes[size];
  
  // Link to dashboard if logged in, otherwise to home
  const href = user ? '/dashboard' : '/';

  return (
    <Link href={href} className={`flex-shrink-0 flex items-center group ${className}`}>
      <Image
        src="/images/SjoelifyLogo.png"
        alt="Sjoelify"
        width={width}
        height={height}
        className="h-auto w-auto"
        priority // Load this image before others
      />
    </Link>
  );
} 