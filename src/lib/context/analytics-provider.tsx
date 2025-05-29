'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { logPageView } from '../analytics';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Log page view whenever the pathname changes
    if (pathname) {
      // Extract a clean page name from the pathname
      const pageName = pathname === '/' ? 'Home' : pathname.slice(1).replace(/\//g, ' - ');
      logPageView(pageName);
    }
  }, [pathname]);

  return <>{children}</>;
} 