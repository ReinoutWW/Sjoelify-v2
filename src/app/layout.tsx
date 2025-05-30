import { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/context/auth-context';
import { LocaleProvider } from '@/lib/context/locale-context';
import { AnalyticsProvider } from '@/lib/context/analytics-provider';
import { Navigation } from '@/shared/components/Navigation';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': 'https://sjoelify.com/#webapp',
      name: 'Sjoelify',
      description: 'Dé gratis sjoelen app van Nederland. Automatische puntentelling, statistieken en ranglijsten.',
      url: 'https://sjoelify.com',
      applicationCategory: 'GameApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '234',
        bestRating: '5',
        worstRating: '1'
      },
      inLanguage: 'nl-NL'
    },
    {
      '@type': 'Organization',
      '@id': 'https://sjoelify.com/#organization',
      name: 'Sjoelify',
      url: 'https://sjoelify.com',
      logo: 'https://sjoelify.com/logo.png',
      sameAs: [
        'https://www.facebook.com/sjoelify',
        'https://twitter.com/sjoelify'
      ],
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'NL'
      }
    },
    {
      '@type': 'WebSite',
      '@id': 'https://sjoelify.com/#website',
      url: 'https://sjoelify.com',
      name: 'Sjoelify',
      description: 'Gratis sjoelen score app voor Nederland',
      publisher: {
        '@id': 'https://sjoelify.com/#organization'
      },
      inLanguage: 'nl-NL'
    }
  ]
};

export const metadata: Metadata = {
  metadataBase: new URL('https://sjoelify.com'),
  title: {
    default: 'Sjoelify™ - Gratis Sjoelen Score App | #1 in Nederland',
    template: '%s | Sjoelify - Sjoelen App'
  },
  description: 'Sjoelify is dé gratis sjoelen app van Nederland! ✅ Automatische puntentelling ✅ Live scores ✅ Statistieken ✅ Speel met vrienden. Download nu!',
  keywords: [
    'sjoelen app',
    'sjoelen score',
    'sjoelbak app',
    'sjoelen puntentelling', 
    'sjoelen regels',
    'gratis sjoelen app',
    'sjoelen Nederland',
    'sjoelen score bijhouden',
    'digitaal sjoelen scorebord',
    'sjoelen statistieken',
    'sjoelen online',
    'Nederlandse sjoelbak app',
    'sjoelen punten tellen',
    'sjoelen app gratis',
    'beste sjoelen app'
  ],
  authors: [{ name: 'Familie Wijnholds', url: 'https://sjoelify.com' }],
  creator: 'Reinout Wijnholds',
  publisher: 'Sjoelify',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'nl_NL',
    url: 'https://sjoelify.com',
    siteName: 'Sjoelify',
    title: 'Sjoelify - Gratis Sjoelen App Nederland | Score & Statistieken',
    description: 'Dé gratis sjoelen app voor heel Nederland! Automatisch punten tellen, ranglijsten bijhouden en spelen met vrienden. Download Sjoelify nu!',
    images: [
      {
        url: 'https://sjoelify.com/og-sjoelify.jpg',
        width: 1200,
        height: 630,
        alt: 'Sjoelify - De beste sjoelen app van Nederland',
        type: 'image/jpeg',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@sjoelify',
    creator: '@sjoelify',
    title: 'Sjoelify - Gratis Sjoelen Score App',
    description: 'Download de beste sjoelen app van Nederland. Gratis score bijhouden!',
    images: ['https://sjoelify.com/twitter-sjoelify.jpg'],
  },
  alternates: {
    canonical: 'https://sjoelify.com',
    languages: {
      'nl': 'https://sjoelify.com',
      'nl-NL': 'https://sjoelify.com',
    },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sjoelify',
    startupImage: [
      {
        url: '/apple-splash-2048-2732.jpg',
        media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
    ],
  },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#3B82F6' },
    ],
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
  category: 'games',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
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
    <html lang="nl" className="h-full">
      <body className={`${inter.className} bg-gradient-to-b from-white to-gray-50 h-full`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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