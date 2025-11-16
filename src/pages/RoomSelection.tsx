import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { roomsAPI } from '../api/api';
import type { Room } from '../types';

export default function RoomSelection() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRooms();
  }, []);

  // PREZENTAČNÍ ÚPRAVA: Automaticky přesměrovat na první dostupný pokoj po načtení
  // Pro návrat k původnímu stavu: odstranit tento useEffect
  useEffect(() => {
    if (!loading && rooms.length > 0 && rooms[0]?.id) {
      const roomId = rooms[0].id;
      // Ověříme, že roomId existuje a není prázdný
      if (roomId && typeof roomId === 'string') {
        // Použijeme relativní cestu bez úvodního lomítka, aby fungovala s basename
        const targetPath = `reservace/${roomId}`;
        console.log('Navigating to:', targetPath, 'roomId:', roomId);
        navigate(targetPath, { replace: true });
      }
    }
  }, [loading, rooms, navigate]);

  async function loadRooms() {
    try {
      setLoading(true);
      const response = await roomsAPI.getAll();
      const availableRooms = response.rooms.filter((room: Room) => room.available);
      setRooms(availableRooms);
      setError(null);
    } catch (err) {
      setError('Nepodařilo se načíst pokoje. Zkuste to prosím později.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Načítání pokojů...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Vyberte si pokoj
        </h1>
        <p className="text-lg text-gray-600">
          Vyberte pokoj a zarezervujte si termín pobytu
        </p>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Momentálně nejsou k dispozici žádné pokoje.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {room.name}
                </h2>
                {room.description && (
                  <p className="text-gray-600 mb-4">{room.description}</p>
                )}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-gray-700">
                    <span className="font-medium">Kapacita:</span>
                    <span className="ml-2">{room.capacity} {room.capacity === 1 ? 'osoba' : room.capacity < 5 ? 'osoby' : 'osob'}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <span className="font-medium">
                      {room.pricingModel === 'seasonal' ? 'Ceník:' : 'Cena za noc:'}
                    </span>
                    <span className="ml-2 font-bold text-blue-600">
                      {room.pricingModel === 'seasonal' 
                        ? 'Sezónní (dle počtu nocí)'
                        : `${room.pricePerNight} Kč`}
                    </span>
                  </div>
                </div>
                <Link
                  to={`/reservace/${room.id}`}
                  className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Rezervovat
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


