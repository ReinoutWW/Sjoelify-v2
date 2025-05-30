import { Metadata } from 'next';

export const siteConfig = {
  name: 'Sjoelify',
  url: 'https://sjoelify.com',
  description: 'Dé ultieme app voor fanatieke sjoelers. Gratis sjoelen score bijhouden met automatische puntentelling.',
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
  ],
  authors: [{ name: 'Reinout Wijnholds', url: 'https://sjoelify.com' }],
  creator: 'Familie Wijnholds',
  publisher: 'Sjoelify',
  locale: 'nl_NL',
  type: 'website',
};

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - Gratis Sjoelen Score App`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: siteConfig.authors,
  creator: siteConfig.creator,
  publisher: siteConfig.publisher,
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
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: `${siteConfig.url}/og-image.png`,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [`${siteConfig.url}/og-image.png`],
    creator: '@sjoelify',
  },
  alternates: {
    canonical: siteConfig.url,
    languages: {
      'nl-NL': siteConfig.url,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
};

export const infoPageMetadata = {
  rules: {
    title: 'Sjoelen Regels - Complete Spelregels Uitleg',
    description: 'Leer alle officiële sjoelen regels! Van puntentelling tot spelverloop. Alles wat je moet weten om te sjoelen uitgelegd in simpele stappen.',
    keywords: ['sjoelen regels', 'sjoelbak regels', 'hoe werkt sjoelen', 'sjoelen spelregels', 'officiële sjoelregels'],
    openGraph: {
      title: 'Sjoelen Regels - Leer Sjoelen in 5 Minuten',
      description: 'Complete uitleg van alle sjoelen spelregels. Van basis tot gevorderd.',
    },
  },
  scoring: {
    title: 'Sjoelen Puntentelling - Uitleg & Calculator',
    description: 'Hoe werkt de puntentelling bij sjoelen? ✓ Complete uitleg ✓ Voorbeelden ✓ Tips voor hoge scores ✓ Gratis puntencalculator',
    keywords: ['sjoelen puntentelling', 'sjoelen punten', 'sjoelen score', 'sjoelen calculator', 'sjoelen punten berekenen'],
    openGraph: {
      title: 'Sjoelen Puntentelling - Alles over Scores & Bonuspunten',
      description: 'Leer hoe je punten telt bij sjoelen. Met handige voorbeelden en tips voor hogere scores.',
    },
  },
  story: {
    title: 'Hoe Het Begon - Het Verhaal van Sjoelify',
    description: 'Ontdek het verhaal achter Sjoelify. Van familie traditie bij de Wijnholds tot de populairste sjoelen app van Nederland.',
    keywords: ['sjoelify verhaal', 'familie wijnholds', 'sjoelen app geschiedenis', 'reinout wijnholds', 'nederlandse sjoelen app'],
    openGraph: {
      title: 'Het Verhaal van Sjoelify - Van Familie Traditie tot App',
      description: 'Hoe een familie traditie leidde tot de ontwikkeling van Nederlands populairste sjoelen app.',
    },
  },
}; 