import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
  // PREZENTAČNÍ ÚPRAVA: Přesměrování z UUID URL PŘED renderováním routeru
  // Kontrola UUID musí být SYNCHRONNÍ, ne v useEffect (ten se spouští až po renderu)
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (pathParts.length > 0) {
    const firstPart = pathParts[0];
    
    // Pokud je první část UUID (a není to admin, reservace nebo potvrzeni), přesměruj na root
    if (uuidPattern.test(firstPart) && firstPart !== 'admin' && firstPart !== 'reservace' && firstPart !== 'potvrzeni') {
      console.log('UUID detected as first part in URL, redirecting to root:', window.location.pathname);
      window.location.replace('/');
      return <div></div>;
    }
    
    // Pokud je první část "reservace" a druhá část je UUID (což je ID rezervace, ne pokoje), přesměruj na root
    if (firstPart === 'reservace' && pathParts.length > 1 && uuidPattern.test(pathParts[1])) {
      console.log('UUID detected in /reservace/ path (reservation ID, not room ID), redirecting to root:', window.location.pathname);
      window.location.replace('/');
      return <div></div>;
    }
  }

  // PREZENTAČNÍ ÚPRAVA: Opravena logika basename - ignorujeme UUID v URL (ID rezervace) - fix pro UUID redirect
  // Zjistíme base path z environment variable nebo použijeme prázdný string (root)
  const getBasePath = () => {
    if (import.meta.env.VITE_BASE_PATH) {
      return import.meta.env.VITE_BASE_PATH;
    }
    
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length === 0) {
      return '';
    }
    
    // Pokud první část vypadá jako UUID (36 znaků s pomlčkami), ignorujeme ho
    const firstPart = pathParts[0];
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(firstPart)) {
      // Je to UUID, použijeme root
      return '';
    }
    
    // Jinak použijeme první část jako basename (např. pro subdirectory deployment)
    return `/${firstPart}`;
  };
  
  const basePath = getBasePath();
  
  return (
    <BrowserRouter basename={basePath}>
      <Routes>
        {/* Uživatelská část */}
        <Route path="/" element={<Layout />}>
          {/* PREZENTAČNÍ ÚPRAVA: Root route zobrazuje ReservationForm přímo, ne RoomSelection */}
          {/* Pro návrat k původnímu stavu: změnit index element na <RoomSelection /> */}
          <Route index element={<ReservationForm />} />
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

