import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reservationsAPI, roomsAPI } from '../../api/api';
import type { Reservation, Room } from '../../types';

export default function AdminDashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    paid: 0,
    cancelled: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [reservationsRes, roomsRes] = await Promise.all([
        reservationsAPI.getAll(),
        roomsAPI.getAll(),
      ]);
      
      setReservations(reservationsRes.reservations);
      setRooms(roomsRes.rooms);
      
      // Výpočet statistik
      const stats = {
        total: reservationsRes.reservations.length,
        pending: reservationsRes.reservations.filter((r: Reservation) => r.status === 'pending').length,
        confirmed: reservationsRes.reservations.filter((r: Reservation) => r.status === 'confirmed').length,
        paid: reservationsRes.reservations.filter((r: Reservation) => r.status === 'paid').length,
        cancelled: reservationsRes.reservations.filter((r: Reservation) => r.status === 'cancelled').length,
      };
      setStats(stats);
    } catch (error) {
      console.error('Chyba při načítání dat:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Načítání...</p>
      </div>
    );
  }

  const recentReservations = [...reservations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('cs-CZ')} ${date.toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  return (
    <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {/* Statistiky */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Celkem rezervací</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-yellow-600">Čeká na potvrzení</div>
            <div className="mt-2 text-3xl font-bold text-yellow-600">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-blue-600">Potvrzeno</div>
            <div className="mt-2 text-3xl font-bold text-blue-600">{stats.confirmed}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-green-600">Zaplaceno</div>
            <div className="mt-2 text-3xl font-bold text-green-600">{stats.paid}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Pokoje</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{rooms.length}</div>
          </div>
        </div>

        {/* Nejnovější rezervace */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Nejnovější rezervace</h2>
            <Link
              to="/admin/rezervace"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Zobrazit všechny →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vytvořeno
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pokoj
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Host
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Termín
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cena
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stav
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentReservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(reservation.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {reservation.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reservation.roomName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reservation.guestName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(reservation.checkIn).toLocaleDateString('cs-CZ')} - {new Date(reservation.checkOut).toLocaleDateString('cs-CZ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reservation.totalPrice} Kč
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          reservation.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : reservation.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-800'
                            : reservation.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {reservation.status === 'pending'
                          ? 'Čeká'
                          : reservation.status === 'confirmed'
                          ? 'Potvrzeno'
                          : reservation.status === 'paid'
                          ? 'Zaplaceno'
                          : 'Zrušeno'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}

