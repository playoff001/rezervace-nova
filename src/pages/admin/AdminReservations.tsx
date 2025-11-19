import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reservationsAPI } from '../../api/api';
import type { Reservation } from '../../types';

export default function AdminReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  type SortMode = 'created-newest' | 'created-oldest' | 'checkin';
  const [sortMode, setSortMode] = useState<SortMode>('checkin');

  useEffect(() => {
    loadReservations();
  }, []);

  async function loadReservations() {
    try {
      setLoading(true);
      const response = await reservationsAPI.getAll();
      setReservations(response.reservations);
    } catch (error) {
      console.error('Chyba při načítání rezervací:', error);
    } finally {
      setLoading(false);
    }
  }

  const sortedReservations = [...reservations].sort((a, b) => {
    if (sortMode === 'checkin') {
      const aTime = new Date(a.checkIn).getTime();
      const bTime = new Date(b.checkIn).getTime();
      return aTime - bTime;
    }
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return sortMode === 'created-newest' ? bTime - aTime : aTime - bTime;
  });

  const filteredReservations = filter === 'all'
    ? sortedReservations
    : sortedReservations.filter(r => r.status === filter);

  const now = Date.now();
  const upcomingReservationIds = reservations
    .filter(reservation => new Date(reservation.checkOut).getTime() >= now)
    .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
    .slice(0, 2)
    .map(r => r.id);

  if (loading) {
    return (
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Načítání...</p>
      </div>
    );
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('cs-CZ')} ${date.toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const getStatusLabel = (status: Reservation['status']) => {
    switch (status) {
      case 'pending':
        return 'Nová';
      case 'confirmed':
        return 'Potvrzeno';
      case 'paid':
        return 'Zaplaceno';
      case 'cancelled':
      default:
        return 'Zrušeno';
    }
  };

  const getStatusClasses = (status: Reservation['status']) => {
    switch (status) {
      case 'pending':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Rezervace</h1>
        </div>

        {/* Filtry */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Všechny
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Nové
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'confirmed'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Potvrzeno
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'paid'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Zaplaceno
          </button>
        </div>

        <div className="mb-4 flex gap-2 flex-wrap">
          <button
            onClick={() => setSortMode('created-newest')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              sortMode === 'created-newest'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Nejnovější rezervace (dle vytvoření)
          </button>
          <button
            onClick={() => setSortMode('created-oldest')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              sortMode === 'created-oldest'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Nejstarší rezervace (dle vytvoření)
          </button>
          <button
            onClick={() => setSortMode('checkin')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              sortMode === 'checkin'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Podle termínu pobytu
          </button>
        </div>
        <div className="mb-6 flex gap-4 text-xs text-gray-500 items-center">
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded bg-rose-200 border border-rose-300"></span>
            <span>Proběhlá rezervace</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded bg-emerald-200 border border-emerald-300"></span>
            <span>Nejbližší nadcházející rezervace (top 2)</span>
          </div>
        </div>

        {/* Tabulka */}
        <div className="bg-white rounded-lg shadow overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Vytvořeno
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Termín
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Noci
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Cena
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Host
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Telefon
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    E-mail
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Stav
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Akce
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReservations.map((reservation) => {
                  const checkOutTime = new Date(reservation.checkOut).getTime();
                  const isPast = checkOutTime < now;
                  const isUpcoming = upcomingReservationIds.includes(reservation.id);
                  return (
                  <tr
                    key={reservation.id}
                    className={`hover:bg-gray-50 ${
                      isPast
                        ? 'bg-rose-100 border-l-4 border-rose-300 text-gray-600'
                        : isUpcoming
                        ? 'bg-emerald-100 border-l-4 border-emerald-300'
                        : ''
                    }`}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(reservation.createdAt)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {reservation.id.slice(0, 8)}...
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      <div>{new Date(reservation.checkIn).toLocaleDateString('cs-CZ')} (PM)</div>
                      <div>{new Date(reservation.checkOut).toLocaleDateString('cs-CZ')} (AM)</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {reservation.nights}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {reservation.totalPrice} Kč
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {reservation.guestName}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {reservation.guestPhone}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 truncate max-w-[180px]">
                      {reservation.guestEmail}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getStatusClasses(reservation.status)}`}
                      >
                        {getStatusLabel(reservation.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/admin/rezervace/${reservation.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Mobilní zobrazení - skryté */}
        <div className="md:hidden text-center py-8 text-gray-500">
          <p>Tabulka rezervací je dostupná pouze na desktopu.</p>
        </div>
      </div>
  );
}

