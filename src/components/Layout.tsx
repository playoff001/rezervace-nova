import { Outlet, Link } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* PREZENTAČNÍ ÚPRAVA: Horní lišta je skrytá pro minimalizaci výšky (pro iframe) */}
      {/* Pro návrat k původnímu stavu: odkomentovat následující <header> blok */}
      {/*
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              🏨 Penzion
            </Link>
            <Link
              to="/admin"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Administrace
            </Link>
          </div>
        </div>
      </header>
      */}
      
      {/* PREZENTAČNÍ ÚPRAVA: Decentní ikonka do administrace v pravém horním rohu */}
      {/* Pro návrat k původnímu stavu: odstranit tento Link */}
      <Link
        to="/admin"
        className="fixed top-4 right-4 z-50 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        title="Administrace"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
          />
        </svg>
      </Link>
      
      <main>
        <Outlet />
      </main>
      
      {/* PREZENTAČNÍ ÚPRAVA: Patička je skrytá pro minimalizaci výšky */}
      {/* Pro návrat k původnímu stavu: odkomentovat následující <footer> blok */}
      {/*
      <footer className="bg-white border-t mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <p className="text-center text-gray-600 text-sm">
            © 2024 Penzion. Všechna práva vyhrazena.
          </p>
        </div>
      </footer>
      */}
    </div>
  );
}





