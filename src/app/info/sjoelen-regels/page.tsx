import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Sjoelen Regels - Complete Spelregels Uitleg',
  description: 'Leer alle officiële sjoelen regels! Van puntentelling tot spelverloop. Alles wat je moet weten om te sjoelen uitgelegd in simpele stappen.',
  keywords: 'sjoelen regels, sjoelbak regels, hoe werkt sjoelen, sjoelen spelregels, officiële sjoelregels',
  openGraph: {
    title: 'Sjoelen Regels - Leer Sjoelen in 5 Minuten',
    description: 'Complete uitleg van alle sjoelen spelregels. Van basis tot gevorderd.',
  },
  alternates: {
    canonical: 'https://sjoelify.nl/info/sjoelen-regels',
  },
};

export default function SjoelenRegelsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Sjoelen Regels - Complete Spelregels Uitleg',
    description: 'Leer alle officiële sjoelen regels! Van puntentelling tot spelverloop.',
    author: {
      '@type': 'Organization',
      name: 'Sjoelify'
    },
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-8">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Terug naar home
        </Link>

        <article className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sjoelen Regels: De Complete Gids voor Beginners en Gevorderden
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Sjoelen is een klassiek Nederlands spel dat al generaties lang wordt gespeeld. 
            In deze uitgebreide gids leer je alle officiële spelregels, van de basis tot gevorderde technieken.
          </p>

          <nav className="bg-gray-50 p-6 rounded-lg mb-8">
            <h2 className="text-lg font-semibold mb-3 text-gray-900">Inhoudsopgave</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li><a href="#wat-is-sjoelen" className="text-primary-600 hover:underline">Wat is sjoelen?</a></li>
              <li><a href="#benodigdheden" className="text-primary-600 hover:underline">Benodigdheden</a></li>
              <li><a href="#spelverloop" className="text-primary-600 hover:underline">Het spelverloop</a></li>
              <li><a href="#puntentelling" className="text-primary-600 hover:underline">Puntentelling</a></li>
              <li><a href="#tips" className="text-primary-600 hover:underline">Tips voor beginners</a></li>
            </ol>
          </nav>

          <h2 id="wat-is-sjoelen" className="text-3xl font-bold mt-12 mb-4 text-gray-900">Wat is sjoelen?</h2>
          <p className="text-gray-700">
            Sjoelen is een traditioneel Nederlands bordspel waarbij spelers houten schijven (sjoelstenen) 
            over een gladde houten bak schuiven. Het doel is om de schijven in vakjes met verschillende 
            puntenwaarden te krijgen. Het spel vereist precisie, techniek en een beetje geluk.
          </p>

          <h2 id="benodigdheden" className="text-3xl font-bold mt-12 mb-4 text-gray-900">Benodigdheden</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>Sjoelbak:</strong> Een houten bak van ongeveer 2 meter lang</li>
            <li><strong>30 sjoelstenen:</strong> Ronde houten schijven</li>
            <li><strong>Scorebord:</strong> Voor het bijhouden van de punten (of gebruik de <Link href="/auth/sign-up" className="text-primary-600 hover:underline">Sjoelify app</Link> voor automatische puntentelling!)</li>
            <li><strong>2-4 spelers:</strong> Ideaal aantal voor een spel</li>
          </ul>

          <h2 id="spelverloop" className="text-3xl font-bold mt-12 mb-4 text-gray-900">Het spelverloop</h2>
          <p className="text-gray-700">Een sjoelbeurt bestaat uit drie worpen:</p>
          
          <ol className="list-decimal pl-6 space-y-3 mt-4 text-gray-700">
            <li>
              <strong>Eerste worp:</strong> De speler schuift alle 30 stenen vanaf de startlijn. 
              Stenen die in een vak terechtkomen blijven liggen.
            </li>
            <li>
              <strong>Tweede worp:</strong> Alleen de stenen die niet in een vak liggen worden teruggenomen 
              en opnieuw gegooid.
            </li>
            <li>
              <strong>Derde worp:</strong> De laatste kans om de overgebleven stenen in de vakken te krijgen.
            </li>
          </ol>

          <div className="bg-blue-50 p-6 rounded-lg mt-6">
            <h3 className="text-xl font-semibold mb-2 text-gray-900">💡 Belangrijk om te weten</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Stenen die van de bak vallen tellen niet mee</li>
              <li>Stenen moeten volledig in een vak liggen om te tellen</li>
              <li>Je mag niet over de startlijn leunen tijdens het gooien</li>
            </ul>
          </div>

          <h2 id="puntentelling" className="text-3xl font-bold mt-12 mb-4 text-gray-900">Puntentelling</h2>
          <p className="text-gray-700">De sjoelbak heeft vier vakken met de volgende puntenwaarden:</p>
          
          <div className="grid grid-cols-4 gap-4 mt-6 mb-6">
            <div className="bg-gray-100 p-4 text-center rounded">
              <div className="text-3xl font-bold text-primary-600">2</div>
              <div className="text-sm text-gray-600">punten</div>
            </div>
            <div className="bg-gray-100 p-4 text-center rounded">
              <div className="text-3xl font-bold text-primary-600">3</div>
              <div className="text-sm text-gray-600">punten</div>
            </div>
            <div className="bg-gray-100 p-4 text-center rounded">
              <div className="text-3xl font-bold text-primary-600">4</div>
              <div className="text-sm text-gray-600">punten</div>
            </div>
            <div className="bg-gray-100 p-4 text-center rounded">
              <div className="text-3xl font-bold text-primary-600">1</div>
              <div className="text-sm text-gray-600">punt</div>
            </div>
          </div>

          <h3 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">Bonuspunten</h3>
          <p className="text-gray-700">
            Als je in elk vak minstens één steen hebt, krijg je <strong>20 bonuspunten</strong> per set! 
            Dit maakt het strategisch interessant om te mikken op verschillende vakken.
          </p>

          <div className="bg-green-50 p-6 rounded-lg mt-6">
            <h4 className="font-semibold mb-2 text-gray-900">Voorbeeld puntentelling:</h4>
            <ul className="space-y-1 text-gray-700">
              <li className="font-semibold text-primary-600">Stap 1: Complete sets = 1 (minimum van 3,2,2,1)</li>
              <li>Bonus: 1 × 20 = 20 punten</li>
              <li className="mt-2">Stap 2: Overgebleven stenen = 2-1-1-0</li>
              <li>Vak 1: 2 × 2 = 4 punten</li>
              <li>Vak 2: 1 × 3 = 3 punten</li>
              <li>Vak 3: 1 × 4 = 4 punten</li>
              <li>Vak 4: 0 × 1 = 0 punten</li>
              <li className="font-bold text-green-700">Totaal: 20 + 11 = 31 punten</li>
            </ul>
          </div>

          <h2 id="tips" className="text-3xl font-bold mt-12 mb-4 text-gray-900">Tips voor beginners</h2>
          <ol className="list-decimal pl-6 space-y-3 text-gray-700">
            <li>
              <strong>Focus op complete sets:</strong> De bonus van 20 punten is vaak meer waard dan 
              alleen mikken op het 4-punten vak.
            </li>
            <li>
              <strong>Gebruik de juiste techniek:</strong> Schuif de stenen met een vloeiende beweging, 
              niet te hard maar ook niet te zacht.
            </li>
            <li>
              <strong>Let op je houding:</strong> Sta recht achter de bak en gebruik een consistente 
              werpbeweging.
            </li>
            <li>
              <strong>Oefen je precisie:</strong> Begin met mikken op het middelste gebied en werk 
              vandaar uit naar de zijkanten.
            </li>
          </ol>

          <div className="bg-primary-50 p-8 rounded-lg mt-12 text-center">
            <h3 className="text-2xl font-bold mb-4 text-gray-900 !text-gray-900">Klaar om te beginnen met sjoelen?</h3>
            <p className="mb-6 text-gray-700 !text-gray-700">
              Gebruik Sjoelify om je scores bij te houden en je voortgang te volgen!
            </p>
            <Link 
              href="/auth/sign-up" 
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Start nu gratis
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
} 