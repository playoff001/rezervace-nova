import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function AdminLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
    }
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    navigate('/admin');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center px-2 pt-1 text-sm font-medium text-gray-900"
              >
                🏨 Administrace
              </Link>
              <Link
                to="/"
                className="inline-flex items-center px-2 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 ml-4"
              >
                ← Hlavní stránka
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavLink
                  to="/admin/dashboard"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                    }`
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/admin/rezervace"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                    }`
                  }
                >
                  Rezervace
                </NavLink>
                <NavLink
                  to="/admin/pokoje"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                    }`
                  }
                >
                  Pokoje
                </NavLink>
                <NavLink
                  to="/admin/nastaveni"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                    }`
                  }
                >
                  Nastavení
                </NavLink>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                Odhlásit se
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}


