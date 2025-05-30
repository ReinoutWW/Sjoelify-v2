'use client';

import { useLocale } from '@/lib/context/locale-context';

export function useDateFormatter() {
  const { locale } = useLocale();

  const formatDate = (dateString: string | number | Date | undefined | null, options?: Intl.DateTimeFormatOptions) => {
    if (!dateString) return '';
    
    try {
      // Handle Firestore Timestamp
      if (typeof dateString === 'object' && dateString !== null && 'seconds' in dateString && typeof dateString.seconds === 'number') {
        const date = new Date(dateString.seconds * 1000);
        if (isNaN(date.getTime())) return '';
        
        return new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-US', options || {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(date);
      }
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      return new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-US', options || {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const formatRelativeTime = (dateString: string | number | Date | undefined | null) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / 60000);
      const diffInHours = Math.floor(diffInMs / 3600000);
      const diffInDays = Math.floor(diffInMs / 86400000);
      
      if (diffInMinutes < 1) {
        return locale === 'nl' ? 'Nu' : 'Now';
      } else if (diffInMinutes < 60) {
        return locale === 'nl' 
          ? `${diffInMinutes} minuten geleden`
          : `${diffInMinutes} minutes ago`;
      } else if (diffInHours < 24) {
        return locale === 'nl'
          ? `${diffInHours} ${diffInHours === 1 ? 'uur' : 'uur'} geleden`
          : `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
      } else if (diffInDays < 7) {
        return locale === 'nl'
          ? `${diffInDays} ${diffInDays === 1 ? 'dag' : 'dagen'} geleden`
          : `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
      } else {
        return formatDate(date);
      }
    } catch (error) {
      console.error('Error formatting relative time:', error);
      return '';
    }
  };

  return {
    formatDate,
    formatRelativeTime
  };
} 