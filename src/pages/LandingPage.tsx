import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
          Rezervační formulář pro penziony
        </h1>
        <p className="text-lg sm:text-xl text-gray-600">
          Vyberte si, jaký typ rezervačního formuláře chcete použít.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 flex flex-col">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Formulář pro celý penzion
          </h2>
          <p className="text-gray-600 mb-6 flex-1">
            Jednoduchý rezervační formulář pro pronájem celého penzionu jako jednoho
            ubytovacího celku. Vhodné pro penziony, které nabízejí vždy celý objekt.
          </p>
          <ul className="text-sm text-gray-600 mb-6 space-y-1">
            <li>• online kalendář obsazenosti</li>
            <li>• automatické potvrzovací e‑maily s platebními údaji</li>
            <li>• generování QR kódu pro platbu a faktury v PDF</li>
          </ul>
          <Link
            to="/penzion"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            Otevřít formulář pro penzion
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-dashed border-gray-200 p-8 flex flex-col">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Formulář pro jednotlivé pokoje
          </h2>
          <p className="text-gray-600 mb-6 flex-1">
            Připravujeme rozšířenou verzi pro penziony s&nbsp;více pokoji, kde si host
            vybere konkrétní pokoj nebo apartmán. Každý pokoj může mít vlastní kapacitu,
            ceny i dostupnost.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Tato varianta je ve vývoji. Pokud o ni máte zájem, dejte nám vědět –
            pomůžeme vám ji nastavit přímo pro váš penzion.
          </p>
          <Link
            to="/pokoje"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Zobrazit informace
          </Link>
        </div>
      </div>
    </div>
  );
}



