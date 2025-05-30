import { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/context/auth-context';
import { LocaleProvider } from '@/lib/context/locale-context';
import { AnalyticsProvider } from '@/lib/context/analytics-provider';
import { Navigation } from '@/shared/components/Navigation';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sjoelify - Volg je Sjoelen Spellen',
  description: 'Volg en analyseer je sjoelen spellen met vrienden',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sjoelify'
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: [
      {
        url: '/favicon-light.ico',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/favicon-dark.ico', 
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' }
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className={`${inter.className} bg-gradient-to-b from-white to-gray-50`}>
        <AuthProvider>
          <LocaleProvider>
            <AnalyticsProvider>
              <Navigation />
              <main>{children}</main>
              <PWAInstallPrompt />
            </AnalyticsProvider>
          </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 