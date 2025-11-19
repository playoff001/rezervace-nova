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
  // Zjistíme base path z environment variable nebo z window.location
  // V produkci by neměl být basePath (aplikace běží na root doméně)
  const basePath = import.meta.env.VITE_BASE_PATH || '';
  
  // Ověření, že URL není starý formát s /admin/reservace/...
  useEffect(() => {
    const pathname = window.location.pathname;
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    // Pokud je to stará admin/reservace URL, přesměruj na root
    if (pathname.includes('/admin/reservace/') && pathname.match(/\/admin\/reservace\/[0-9a-f-]+$/i)) {
      console.log('Detected old admin/reservace URL, redirecting to root:', pathname);
      window.location.replace('/');
      return;
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

