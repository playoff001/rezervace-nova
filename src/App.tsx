import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import RoomSelection from './pages/RoomSelection';
import ReservationForm from './pages/ReservationForm';
import ReservationConfirmation from './pages/ReservationConfirmation';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRooms from './pages/admin/AdminRooms';
import AdminReservations from './pages/admin/AdminReservations';
import AdminReservationDetail from './pages/admin/AdminReservationDetail';
import AdminSettings from './pages/admin/AdminSettings';
import Layout from './components/Layout';
import AdminLayout from './components/admin/AdminLayout';

function App() {
  // V produkci by neměl být basePath (aplikace běží na root doméně)
  const basePath = import.meta.env.VITE_BASE_PATH || '';
  
  // Ověření a přesměrování ze starých URL formátů (jako záloha, pokud index.html nepomohl)
  useEffect(() => {
    const pathname = window.location.pathname;
    
    // Všechny staré URL formáty, které mají být přesměrovány na root
    const isOldFormat = 
      // /reservace/{UUID} - starý formát se "s"
      /^\/reservace\/[0-9a-f-]+$/i.test(pathname) ||
      // /admin/reservace/{UUID} - starý admin detail se "s"
      /^\/admin\/reservace\/[0-9a-f-]+$/i.test(pathname) ||
      // /rezervace/{UUID} pokud UUID vypadá jako rezervace ID (delší než room ID)
      (/^\/rezervace\/[0-9a-f-]+$/i.test(pathname) && pathname.match(/\/rezervace\/([0-9a-f-]+)$/i)?.[1]?.length > 20);
    
    if (isOldFormat) {
      console.log('[App.tsx] Old URL format detected, redirecting to root:', pathname);
      window.location.replace('/');
      return;
    }
    
    // Kontrola podle částí cesty
    const pathParts = pathname.split('/').filter(Boolean);
    if (pathParts.length >= 2) {
      // /reservace/{UUID} nebo /admin/reservace/{UUID}
      if (
        (pathParts[0] === 'reservace' && uuidPattern.test(pathParts[1])) ||
        (pathParts[0] === 'admin' && pathParts[1] === 'reservace' && pathParts.length > 2 && uuidPattern.test(pathParts[2]))
      ) {
        console.log('[App.tsx] Old format with UUID detected, redirecting to root:', pathname);
        window.location.replace('/');
        return;
      }
    }
  }, []);
  
  return (
    <BrowserRouter basename={basePath}>
      <Routes>
        {/* Uživatelská část */}
        <Route path="/" element={<Layout />}>
          <Route index element={<RoomSelection />} />
          <Route path="reservace/:roomId" element={<ReservationForm />} />
          <Route path="potvrzeni/:reservationId" element={<ReservationConfirmation />} />
        </Route>

        {/* Administrace */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/pokoje" element={<AdminRooms />} />
          <Route path="/admin/rezervace" element={<AdminReservations />} />
          <Route path="/admin/rezervace/:id" element={<AdminReservationDetail />} />
          <Route path="/admin/nastaveni" element={<AdminSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

