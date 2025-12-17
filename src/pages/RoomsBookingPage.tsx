import { useEffect, useState } from 'react';
import { roomsAPI } from '../api/api';
import type { Room } from '../types';

export default function RoomsBookingPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    try {
      setLoading(true);
      const response = await roomsAPI.getAll();
      // Pro pokojovou variantu budeme typicky chtít vše kromě celého penzionu
      const filtered = (response.rooms || []).filter(
        (room: Room) => room.name !== 'Penzion'
      );
      setRooms(filtered);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Nepodařilo se načíst pokoje. Zkuste to prosím později.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
          Rezervace jednotlivých pokojů
        </h1>
        <p className="text-gray-600">
          Tady bude nový rezervační formulář pro modrý a zelený pokoj s výběrem
          služeb (snídaně, polopenze, plná penze, parkování atd.).
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Zatím je to jen přehled pokojů podle dat v administraci „Pokoje“ –
          samotná logika rezervace bude doplněna v dalším kroku.
        </p>
      </div>

      {loading && (
        <div className="text-center text-gray-600">Načítání pokojů…</div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {!loading && !error && rooms.length === 0 && (
        <div className="text-center text-gray-600">
          Zatím nemáte nastavené žádné samostatné pokoje. Přidejte je v
          administraci v sekci <strong>Pokoje</strong>.
        </div>
      )}

      {!loading && !error && rooms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {room.name}
              </h2>
              {room.description && (
                <p className="text-gray-600 mb-4 flex-1">{room.description}</p>
              )}
              <div className="text-sm text-gray-700 space-y-1 mb-4">
                <p>
                  <span className="font-medium">Kapacita:</span>{' '}
                  {room.capacity} osob
                </p>
                <p>
                  <span className="font-medium">Základní cena:</span>{' '}
                  {room.pricePerNight} Kč / osoba / den
                </p>
              </div>
              {room.extraServices && (
                <div className="text-sm text-gray-700 mb-4 space-y-1">
                  {room.extraServices.breakfastPrice &&
                    room.extraServices.breakfastPrice > 0 && (
                      <p>
                        Snídaně: +{room.extraServices.breakfastPrice} Kč / osoba
                        / den
                      </p>
                    )}
                  {room.extraServices.halfBoardPrice &&
                    room.extraServices.halfBoardPrice > 0 && (
                      <p>
                        Polopenze: +{room.extraServices.halfBoardPrice} Kč /
                        osoba / den
                      </p>
                    )}
                  {room.extraServices.fullBoardPrice &&
                    room.extraServices.fullBoardPrice > 0 && (
                      <p>
                        Plná penze: +{room.extraServices.fullBoardPrice} Kč /
                        osoba / den
                      </p>
                    )}
                  {room.extraServices.customLabel &&
                    room.extraServices.customServicePrice &&
                    room.extraServices.customServicePrice > 0 && (
                      <p>
                        {room.extraServices.customLabel}: +
                        {room.extraServices.customServicePrice} Kč / osoba /
                        den
                      </p>
                    )}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-auto">
                Rezervační formulář pro tento pokoj bude k dispozici v další
                verzi. Zatím si zde pouze nastavte pokoje a jejich ceny.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



