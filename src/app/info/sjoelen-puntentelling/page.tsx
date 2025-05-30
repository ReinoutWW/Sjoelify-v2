import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeftIcon, CalculatorIcon } from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Sjoelen Puntentelling - Uitleg & Calculator | Sjoelify',
  description: 'Hoe werkt de puntentelling bij sjoelen? ✓ Complete uitleg ✓ Voorbeelden ✓ Tips voor hoge scores ✓ Gratis puntencalculator',
  keywords: 'sjoelen puntentelling, sjoelen punten, sjoelen score, sjoelen calculator, sjoelen punten berekenen',
  openGraph: {
    title: 'Sjoelen Puntentelling - Alles over Scores & Bonuspunten',
    description: 'Leer hoe je punten telt bij sjoelen. Met handige voorbeelden en tips voor hogere scores.',
  },
  alternates: {
    canonical: 'https://sjoelify.nl/info/sjoelen-puntentelling',
  },
};

export default function SjoelenPuntentellingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Hoe werkt de puntentelling bij sjoelen?',
    description: 'Stap voor stap uitleg over het tellen van punten bij sjoelen',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Tel de stenen per vak',
        text: 'Tel hoeveel stenen er in elk vak liggen'
      },
      {
        '@type': 'HowToStep', 
        name: 'Vermenigvuldig met vakwaarde',
        text: 'Vermenigvuldig het aantal stenen met de waarde van het vak'
      },
      {
        '@type': 'HowToStep',
        name: 'Bereken bonuspunten',
        text: 'Tel 20 bonuspunten per complete set (1 steen in elk vak)'
      }
    ]
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
            Sjoelen Puntentelling: De Complete Gids met Voorbeelden
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            De puntentelling bij sjoelen lijkt ingewikkeld, maar is eigenlijk heel logisch. 
            In deze gids leggen we stap voor stap uit hoe je punten telt, inclusief bonuspunten!
          </p>

          <div className="bg-primary-50 p-6 rounded-lg mb-8">
            <h2 className="text-lg font-semibold mb-3 flex items-center text-gray-900">
              <CalculatorIcon className="h-6 w-6 mr-2" />
              Snel overzicht puntentelling
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>✓ Vak 1 (links): <strong>2 punten</strong> per steen</li>
              <li>✓ Vak 2: <strong>3 punten</strong> per steen</li>
              <li>✓ Vak 3: <strong>4 punten</strong> per steen</li>
              <li>✓ Vak 4 (rechts): <strong>1 punt</strong> per steen</li>
              <li>✓ <strong>Bonus:</strong> 20 punten per complete set</li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-4 text-gray-900">Hoe werkt de puntentelling?</h2>
          
          <h3 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">Stap 1: Tel de stenen per vak</h3>
          <p className="text-gray-700">
            Na je drie worpen tel je hoeveel stenen er in elk vak liggen. Alleen stenen die 
            <strong> volledig</strong> in een vak liggen tellen mee. Stenen op de lijn of half 
            in een vak tellen niet.
          </p>

          <h3 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">Stap 2: Bereken de complete sets</h3>
          <p className="text-gray-700">
            Een complete set betekent dat je minstens 1 steen in elk van de vier vakken hebt. 
            Het aantal complete sets wordt bepaald door het vak met de minste stenen.
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mt-4">
            <p className="font-semibold text-gray-900">⚡ Voorbeeld:</p>
            <p className="text-gray-700">
              Heb je 5-3-2-4 stenen? Dan heb je 2 complete sets (want vak 3 heeft maar 2 stenen).
              Je krijgt dan 2 × 20 = 40 bonuspunten.
            </p>
          </div>

          <h3 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">Stap 3: Bereken de overgebleven punten</h3>
          <p className="text-gray-700">
            Na het berekenen van de complete sets, bereken je de punten voor de overgebleven stenen. 
            Vermenigvuldig het aantal overgebleven stenen per vak met de waarde van dat vak.
          </p>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mt-4">
            <p className="font-semibold text-gray-900">💡 Pro tip:</p>
            <p className="text-gray-700">
              In het voorbeeld hierboven (5-3-2-4) houd je 3-1-0-2 stenen over voor de normale punten:
              (3×2) + (1×3) + (0×4) + (2×1) = 6 + 3 + 0 + 2 = 11 punten
            </p>
          </div>

          <h3 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">Stap 4: Tel alles bij elkaar op</h3>
          <p className="text-gray-700">
            De eindscore is de som van:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Bonuspunten (aantal sets × 20)</li>
            <li>Punten van overgebleven stenen</li>
          </ul>

          <div className="bg-green-50 border-l-4 border-green-400 p-6 mt-4">
            <p className="font-semibold text-gray-900">🎯 Voorbeeld totaalscore:</p>
            <p className="text-gray-700">
              Bonus: 2 sets × 20 = 40 punten<br />
              Overgebleven: 11 punten<br />
              <strong>Totaal: 51 punten</strong>
            </p>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-4 text-gray-900">Praktijkvoorbeelden</h2>
          
          <div className="space-y-6">
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Voorbeeld 1: Beginner score</h3>
              <div className="grid grid-cols-5 gap-2 text-center mb-4">
                <div className="bg-gray-100 p-3 rounded">
                  <div className="text-sm text-gray-600">Vak 1</div>
                  <div className="font-bold text-gray-900">3 stenen</div>
                </div>
                <div className="bg-gray-100 p-3 rounded">
                  <div className="text-sm text-gray-600">Vak 2</div>
                  <div className="font-bold text-gray-900">2 stenen</div>
                </div>
                <div className="bg-gray-100 p-3 rounded">
                  <div className="text-sm text-gray-600">Vak 3</div>
                  <div className="font-bold text-gray-900">1 steen</div>
                </div>
                <div className="bg-gray-100 p-3 rounded">
                  <div className="text-sm text-gray-600">Vak 4</div>
                  <div className="font-bold text-gray-900">4 stenen</div>
                </div>
                <div className="bg-primary-100 p-3 rounded">
                  <div className="text-sm text-gray-600">Sets</div>
                  <div className="font-bold text-primary-600">1</div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-semibold mb-2 text-gray-900">Berekening:</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li className="font-semibold text-primary-600">Stap 1: Complete sets = 1 (minimum van 3,2,1,4)</li>
                  <li>Bonus: 1 × 20 = 20 punten</li>
                  <li className="mt-2">Stap 2: Overgebleven stenen = 2-1-0-3</li>
                  <li>Vak 1: 2 × 2 = 4 punten</li>
                  <li>Vak 2: 1 × 3 = 3 punten</li>
                  <li>Vak 3: 0 × 4 = 0 punten</li>
                  <li>Vak 4: 3 × 1 = 3 punten</li>
                  <li className="font-bold text-lg pt-2 border-t text-gray-900">Totaal: 20 + 10 = 30 punten</li>
                </ul>
              </div>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Voorbeeld 2: Gevorderde score</h3>
              <div className="grid grid-cols-5 gap-2 text-center mb-4">
                <div className="bg-gray-100 p-3 rounded">
                  <div className="text-sm text-gray-600">Vak 1</div>
                  <div className="font-bold text-gray-900">5 stenen</div>
                </div>
                <div className="bg-gray-100 p-3 rounded">
                  <div className="text-sm text-gray-600">Vak 2</div>
                  <div className="font-bold text-gray-900">6 stenen</div>
                </div>
                <div className="bg-gray-100 p-3 rounded">
                  <div className="text-sm text-gray-600">Vak 3</div>
                  <div className="font-bold text-gray-900">4 stenen</div>
                </div>
                <div className="bg-gray-100 p-3 rounded">
                  <div className="text-sm text-gray-600">Vak 4</div>
                  <div className="font-bold text-gray-900">7 stenen</div>
                </div>
                <div className="bg-primary-100 p-3 rounded">
                  <div className="text-sm text-gray-600">Sets</div>
                  <div className="font-bold text-primary-600">4</div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-semibold mb-2 text-gray-900">Berekening:</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li className="font-semibold text-primary-600">Stap 1: Complete sets = 4 (minimum van 5,6,4,7)</li>
                  <li>Bonus: 4 × 20 = 80 punten</li>
                  <li className="mt-2">Stap 2: Overgebleven stenen = 1-2-0-3</li>
                  <li>Vak 1: 1 × 2 = 2 punten</li>
                  <li>Vak 2: 2 × 3 = 6 punten</li>
                  <li>Vak 3: 0 × 4 = 0 punten</li>
                  <li>Vak 4: 3 × 1 = 3 punten</li>
                  <li className="font-bold text-lg pt-2 border-t text-gray-900">Totaal: 80 + 11 = 91 punten</li>
                </ul>
              </div>
            </div>

            <div className="bg-white border-2 border-green-500 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Voorbeeld 3: Maximale score!</h3>
              <div className="grid grid-cols-5 gap-2 text-center mb-4">
                <div className="bg-gray-100 p-3 rounded">
                  <div className="text-sm text-gray-600">Vak 1</div>
                  <div className="font-bold text-gray-900">7 stenen</div>
                </div>
                <div className="bg-gray-100 p-3 rounded">
                  <div className="text-sm text-gray-600">Vak 2</div>
                  <div className="font-bold text-gray-900">7 stenen</div>
                </div>
                <div className="bg-gray-100 p-3 rounded">
                  <div className="text-sm text-gray-600">Vak 3</div>
                  <div className="font-bold text-gray-900">9 stenen</div>
                </div>
                <div className="bg-gray-100 p-3 rounded">
                  <div className="text-sm text-gray-600">Vak 4</div>
                  <div className="font-bold text-gray-900">7 stenen</div>
                </div>
                <div className="bg-green-100 p-3 rounded">
                  <div className="text-sm text-gray-600">Sets</div>
                  <div className="font-bold text-green-600">7</div>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <h4 className="font-semibold mb-2 text-gray-900">Berekening:</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li className="font-semibold text-primary-600">Stap 1: Complete sets = 7 (minimum van 7,7,9,7)</li>
                  <li>Bonus: 7 × 20 = 140 punten</li>
                  <li className="mt-2">Stap 2: Overgebleven stenen = 0-0-2-0</li>
                  <li>Vak 1: 0 × 2 = 0 punten</li>
                  <li>Vak 2: 0 × 3 = 0 punten</li>
                  <li>Vak 3: 2 × 4 = 8 punten</li>
                  <li>Vak 4: 0 × 1 = 0 punten</li>
                  <li className="font-bold text-lg pt-2 border-t text-green-700">Totaal: 140 + 8 = 148 punten - PERFECT! 🎉</li>
                </ul>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-4 text-gray-900">Veelgestelde vragen</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-2 text-gray-900">Wat is de maximale score bij sjoelen?</h3>
              <p className="text-gray-700">
                De maximale score is 148 punten met 30 stenen. Dit krijg je met de perfecte 
                verdeling: 7-7-9-7 (van links naar rechts). Dit geeft je 7 complete sets (140 punten) 
                plus 2 extra stenen in vak 3 (8 punten). In de praktijk is alles boven 
                de 120 punten een uitstekende score!
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-2 text-gray-900">Tellen stenen op de lijn mee?</h3>
              <p className="text-gray-700">
                Nee, stenen moeten volledig binnen de lijnen van een vak liggen om mee te tellen. 
                Bij twijfel kun je een rechte rand (zoals een liniaal) gebruiken om te controleren.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-2 text-gray-900">Wanneer tel je bonuspunten?</h3>
              <p className="text-gray-700">
                Je telt alleen bonuspunten als je minstens 1 steen in elk van de vier vakken hebt. 
                Dus 10-10-10-0 levert geen bonuspunten op, maar 7-7-7-1 wel!
              </p>
            </div>
          </div>

          <div className="bg-primary-50 p-8 rounded-lg mt-12 text-center">
            <h3 className="text-2xl font-bold mb-4 text-gray-900 !text-gray-900">Automatisch punten tellen met Sjoelify</h3>
            <p className="mb-6 text-gray-700 !text-gray-700">
              Geen zin om zelf te rekenen? Met Sjoelify voer je alleen het aantal stenen per vak in 
              en de app berekent automatisch je score inclusief bonuspunten!
            </p>
            <Link 
              href="/auth/sign-up" 
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Probeer Sjoelify gratis
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
} 