import Image from 'next/image';
import Link from 'next/link';

interface SjoelifyLogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export function SjoelifyLogo({ className = '', size = 'medium' }: SjoelifyLogoProps) {
  // Define sizes for different variants
  const sizes = {
    small: { width: 80, height: 27 },
    medium: { width: 180, height: 60 },
    large: { width: 210, height: 70 }
  };

  const { width, height } = sizes[size];

  return (
    <Link href="/" className={`flex-shrink-0 flex items-center group ${className}`}>
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