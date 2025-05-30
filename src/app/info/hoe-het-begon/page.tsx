import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeftIcon, HeartIcon, CodeBracketIcon } from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Hoe Het Begon - Het Verhaal achter Sjoelify',
  description: 'Ontdek hoe Sjoelify ontstond uit een familie traditie. Van generaties sjoelen tot een moderne app.',
  keywords: 'sjoelify verhaal, hoe het begon, wijnholds familie, nederlandse app',
  openGraph: {
    title: 'Het Verhaal achter Sjoelify',
    description: 'Van familie traditie tot moderne sjoelen app',
  },
  alternates: {
    canonical: 'https://sjoelify.nl/info/hoe-het-begon',
  },
};

export default function HoeHetBegonPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Hoe Het Begon - Het Verhaal achter Sjoelify',
    description: 'Ontdek hoe Sjoelify ontstond uit een familie traditie.',
    author: {
      '@type': 'Person',
      name: 'Reinout Wijnholds'
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
            Hoe Het Begon: Het Verhaal van Sjoelify
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Sjoelify is meer dan zomaar een app - het is een familie traditie die digitaal tot leven komt.
          </p>

          <div className="bg-primary-50 p-8 rounded-lg mb-8">
            <div className="flex items-center mb-4">
              <HeartIcon className="h-8 w-8 text-primary-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900 m-0">Een Familie Traditie</h2>
            </div>
            <p className="text-gray-700 mb-0">
              Bij de familie Wijnholds wordt al generaties lang gesjoeld. Van jong tot oud, 
              iedereen doet mee. Het is meer dan een spel - het is een manier om samen te komen, 
              te lachen en herinneringen te maken.
            </p>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-4 text-gray-900">Van Idee tot App</h2>
          
          <p className="text-gray-700">
            Tijdens één van onze vele familie sjoelmomenten ontstond het idee: "Zou het niet 
            handig zijn als we een app hadden die alles bijhoudt?" Geen gedoe meer met pen en 
            papier, geen discussies over de puntentelling, en altijd onze statistieken bij de hand.
          </p>

          <p className="text-gray-700">
            Als software engineer binnen de familie, nam ik (Reinout Wijnholds) deze uitdaging 
            graag aan. Wat begon als een simpel idee voor de familie, groeide uit tot Sjoelify - 
            een complete app voor iedereen die van sjoelen houdt.
          </p>

          <div className="bg-gray-50 p-8 rounded-lg my-8">
            <div className="flex items-center mb-4">
              <CodeBracketIcon className="h-8 w-8 text-primary-600 mr-3" />
              <h3 className="text-2xl font-semibold text-gray-900 m-0">De Ontwikkeling</h3>
            </div>
            <p className="text-gray-700">
              Met moderne technologie en veel liefde voor het spel, bouwde ik een app die:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4 text-gray-700">
              <li>Automatisch punten berekent</li>
              <li>Statistieken bijhoudt zodat je je vooruitgang kunt zien</li>
              <li>Meerdere spelers ondersteunt voor gezellige competities</li>
              <li>Op elk apparaat werkt - van telefoon tot tablet</li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-4 text-gray-900">Van Familie naar Nederland</h2>
          
          <p className="text-gray-700">
            Wat begon als een oplossing voor onze familie, bleek ook perfect voor andere 
            sjoelliefhebbers. We besloten Sjoelify gratis beschikbaar te maken voor iedereen 
            in Nederland die net zo veel van sjoelen houdt als wij.
          </p>

          <blockquote className="border-l-4 border-primary-600 pl-6 my-8 italic">
            <p className="text-gray-700">
              "Sjoelen brengt mensen samen. Met Sjoelify willen we die ervaring nog 
              leuker en makkelijker maken voor iedereen."
            </p>
            <cite className="text-gray-600 not-italic">- Reinout Wijnholds</cite>
          </blockquote>

          <h2 className="text-3xl font-bold mt-12 mb-4 text-gray-900">De Toekomst</h2>
          
          <p className="text-gray-700">
            Sjoelify blijft groeien en verbeteren. We luisteren naar feedback van gebruikers 
            en voegen regelmatig nieuwe functies toe. Maar de kern blijft hetzelfde: een 
            eenvoudige, gratis app die het plezier van sjoelen vergroot.
          </p>

          <p className="text-gray-700">
            Of je nu een doorgewinterde sjoeler bent of net begint, alleen speelt of met 
            vrienden - Sjoelify is er voor jou. Net zoals bij ons thuis, hopen we dat de 
            app bijdraagt aan vele gezellige sjoelmomenten.
          </p>

          <div className="bg-primary-50 p-8 rounded-lg mt-12 text-center">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Word Deel van Ons Verhaal</h3>
            <p className="mb-6 text-gray-700">
              Begin vandaag nog met het bijhouden van je sjoelen scores en maak je eigen herinneringen!
            </p>
            <Link 
              href="/auth/sign-up" 
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Start met Sjoelify
            </Link>
          </div>

          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <p className="text-center text-gray-600 mb-0">
              <strong>PS:</strong> Nog steeds sjoelen we regelmatig met de familie Wijnholds. 
              En ja, we gebruiken natuurlijk Sjoelify! 🎯
            </p>
          </div>
        </article>
      </div>
    </div>
  );
} 