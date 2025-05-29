import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/context/auth-context';
import { Navigation } from '@/shared/components/Navigation';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sjoelify - Track Your Sjoelen Games',
  description: 'Track and analyze your sjoelen games with friends',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sjoelify'
  },
  formatDetection: {
    telephone: false
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' }
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-b from-white to-gray-50`}>
        <AuthProvider>
          <Navigation />
          <main>{children}</main>
          <PWAInstallPrompt />
        </AuthProvider>
      </body>
    </html>
  );
} 