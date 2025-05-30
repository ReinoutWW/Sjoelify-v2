// Google Analytics gtag types
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string,
      config?: any
    ) => void;
    dataLayer?: any[];
  }
}

export {}; 