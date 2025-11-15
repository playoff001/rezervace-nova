import { useEffect, useState } from 'react';
import { roomsAPI, calendarAPI } from '../../api/api';
import type { Room, Block, SeasonalPricing } from '../../types';
import AdminRoomCalendar from '../../components/admin/AdminRoomCalendar';

export default function AdminRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState({
    name: '',
    capacity: 2,
    pricePerNight: 1000,
    description: '',
    available: true,
    pricingModel: 'simple' as 'simple' | 'seasonal',
    seasonalPricing: {
      mainSeason: { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
      offSeason: { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
      holidays: {
        christmas: {} as { [nights: number]: number },
        newyear: {} as { [nights: number]: number },
        easter: {} as { [nights: number]: number },
      },
    } as SeasonalPricing,
  });

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    try {
      setLoading(true);
      const response = await roomsAPI.getAll();
      setRooms(response.rooms);
    } catch (error) {
      console.error('Chyba při načítání pokojů:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleNewRoom() {
    setEditingRoom(null);
    setRoomForm({
      name: '',
      capacity: 2,
      pricePerNight: 1000,
      description: '',
      available: true,
      pricingModel: 'simple',
      seasonalPricing: {
        mainSeason: { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
        offSeason: { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
        holidays: {
          christmas: {},
          newyear: {},
          easter: {},
        },
      },
    });
    setShowRoomForm(true);
  }

  function handleAddPenzion() {
    setEditingRoom(null);
    setRoomForm({
      name: 'Penzion',
      capacity: 12,
      pricePerNight: 1000,
      description: 'Celý penzion s kapacitou pro 12 osob. V letních měsících preferujeme týdenní pobyty se střídáním v sobotu, nebo v neděli. V zimních měsících pobyty alespoň na 3 noci.',
      available: true,
      pricingModel: 'seasonal',
      seasonalPricing: {
        mainSeason: {
          2: 18000,
          3: 25000,
          4: 31000,
          5: 37000,
          6: 43000,
          7: 49000,
        },
        offSeason: {
          2: 16000,
          3: 22000,
          4: 27000,
          5: 33000,
          6: 39000,
          7: 45000,
        },
        holidays: {
          christmas: {
            4: 40000,
            6: 50000,
          },
          newyear: {
            7: 70000,
          },
          easter: {
            5: 45000,
            7: 50000,
          },
        },
      },
    });
    setShowRoomForm(true);
  }

  function handleEditRoom(room: Room) {
    setEditingRoom(room);
    setRoomForm({
      name: room.name,
      capacity: room.capacity,
      pricePerNight: room.pricePerNight,
      description: room.description || '',
      available: room.available,
      pricingModel: room.pricingModel || 'simple',
      seasonalPricing: room.seasonalPricing || {
        mainSeason: { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
        offSeason: { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
        holidays: {
          christmas: {},
          newyear: {},
          easter: {},
        },
      },
    });
    setShowRoomForm(true);
  }

  async function handleSaveRoom() {
    try {
      const dataToSave: any = {
        name: roomForm.name,
        capacity: roomForm.capacity,
        pricePerNight: roomForm.pricePerNight,
        description: roomForm.description,
        available: roomForm.available,
      };

      if (roomForm.pricingModel === 'seasonal') {
        dataToSave.pricingModel = 'seasonal';
        // Vyčistíme prázdné hodnoty z holidays
        const cleanedHolidays: any = {};
        if (roomForm.seasonalPricing.holidays) {
          Object.keys(roomForm.seasonalPricing.holidays).forEach(holiday => {
            const holidayPricing = roomForm.seasonalPricing.holidays![holiday as keyof typeof roomForm.seasonalPricing.holidays];
            const cleaned: { [nights: number]: number } = {};
            Object.keys(holidayPricing || {}).forEach(nightsStr => {
              const nights = parseInt(nightsStr);
              const price = holidayPricing[nights];
              if (price && price > 0 && nights > 0) {
                cleaned[nights] = price;
              }
            });
            if (Object.keys(cleaned).length > 0) {
              cleanedHolidays[holiday] = cleaned;
            }
          });
        }
        dataToSave.seasonalPricing = {
          mainSeason: roomForm.seasonalPricing.mainSeason,
          offSeason: roomForm.seasonalPricing.offSeason,
          ...(Object.keys(cleanedHolidays).length > 0 && { holidays: cleanedHolidays }),
        };
      } else {
        dataToSave.pricingModel = 'simple';
      }

      if (editingRoom) {
        await roomsAPI.update(editingRoom.id, dataToSave);
      } else {
        await roomsAPI.create(dataToSave);
      }
      setShowRoomForm(false);
      await loadRooms();
    } catch (error) {
      alert('Nepodařilo se uložit pokoj.');
    }
  }

  async function handleDeleteRoom(roomId: string) {
    if (!confirm('Opravdu chcete smazat tento pokoj?')) return;
    
    try {
      await roomsAPI.delete(roomId);
      await loadRooms();
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(null);
      }
    } catch (error) {
      alert('Nepodařilo se smazat pokoj.');
    }
  }

  function updateSeasonalPrice(season: 'mainSeason' | 'offSeason', nights: number, value: number) {
    setRoomForm({
      ...roomForm,
      seasonalPricing: {
        ...roomForm.seasonalPricing,
        [season]: {
          ...roomForm.seasonalPricing[season],
          [nights]: value,
        },
      },
    });
  }

  function updateHolidayPrice(holiday: 'christmas' | 'newyear' | 'easter', nights: number, value: number) {
    setRoomForm({
      ...roomForm,
      seasonalPricing: {
        ...roomForm.seasonalPricing,
        holidays: {
          ...roomForm.seasonalPricing.holidays,
          [holiday]: {
            ...(roomForm.seasonalPricing.holidays?.[holiday] || {}),
            [nights]: value || undefined,
          },
        },
      },
    });
  }

  function removeHolidayPrice(holiday: 'christmas' | 'newyear' | 'easter', nights: number) {
    const holidayPricing = { ...(roomForm.seasonalPricing.holidays?.[holiday] || {}) };
    delete holidayPricing[nights];
    setRoomForm({
      ...roomForm,
      seasonalPricing: {
        ...roomForm.seasonalPricing,
        holidays: {
          ...roomForm.seasonalPricing.holidays,
          [holiday]: holidayPricing,
        },
      },
    });
  }

  if (loading) {
    return (
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Načítání...</p>
      </div>
    );
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Správa pokojů</h1>
          <div className="flex gap-2">
            <button
              onClick={handleAddPenzion}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700"
            >
              + Přidat Penzion
            </button>
            <button
              onClick={handleNewRoom}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              + Přidat pokoj
            </button>
          </div>
        </div>

        {showRoomForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingRoom ? 'Upravit pokoj' : 'Nový pokoj'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Název pokoje *
                </label>
                <input
                  type="text"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kapacita (osob) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Informativní údaj, nemá vliv na cenu</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cenový model *
                </label>
                <select
                  value={roomForm.pricingModel}
                  onChange={(e) => setRoomForm({ ...roomForm, pricingModel: e.target.value as 'simple' | 'seasonal' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="simple">Jednoduchý (cena za noc)</option>
                  <option value="seasonal">Sezónní (tabulka cen)</option>
                </select>
              </div>
              {roomForm.pricingModel === 'simple' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cena za noc (Kč) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={roomForm.pricePerNight}
                    onChange={(e) => setRoomForm({ ...roomForm, pricePerNight: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dostupný
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={roomForm.available}
                    onChange={(e) => setRoomForm({ ...roomForm, available: e.target.checked })}
                    className="mr-2"
                  />
                  <span>Pokoj je dostupný pro rezervace</span>
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Popis
                </label>
                <textarea
                  value={roomForm.description}
                  onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Sezónní ceny */}
            {roomForm.pricingModel === 'seasonal' && (
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Sezónní ceny</h3>
                
                {/* Hlavní sezóna */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3">Hlavní sezóna (leden-březen, červenec-srpen)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[2, 3, 4, 5, 6, 7].map((nights) => (
                      <div key={nights}>
                        <label className="block text-xs text-gray-600 mb-1">
                          {nights} {nights === 1 ? 'noc' : nights < 5 ? 'noci' : 'nocí'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={roomForm.seasonalPricing.mainSeason[nights] > 0 ? roomForm.seasonalPricing.mainSeason[nights] : ''}
                          onChange={(e) => updateSeasonalPrice('mainSeason', nights, parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Kč"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vedlejší sezóna */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3">Vedlejší sezóna (duben-červen, září-prosinec)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[2, 3, 4, 5, 6, 7].map((nights) => (
                      <div key={nights}>
                        <label className="block text-xs text-gray-600 mb-1">
                          {nights} {nights === 1 ? 'noc' : nights < 5 ? 'noci' : 'nocí'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={roomForm.seasonalPricing.offSeason[nights] > 0 ? roomForm.seasonalPricing.offSeason[nights] : ''}
                          onChange={(e) => updateSeasonalPrice('offSeason', nights, parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Kč"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Speciální svátky */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Speciální svátky</h4>
                  
                  {/* Vánoce */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-gray-700 mb-2">Vánoce</h5>
                    <div className="space-y-2">
                      {Object.keys(roomForm.seasonalPricing.holidays?.christmas || {}).map((nightsStr) => {
                        const nights = parseInt(nightsStr);
                        return (
                          <div key={nights} className="flex gap-2 items-center">
                            <input
                              type="number"
                              min="1"
                              value={nights}
                              onChange={(e) => {
                                const newNights = parseInt(e.target.value);
                                if (newNights > 0 && newNights !== nights) {
                                  const price = roomForm.seasonalPricing.holidays?.christmas?.[nights] || 0;
                                  removeHolidayPrice('christmas', nights);
                                  updateHolidayPrice('christmas', newNights, price);
                                }
                              }}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Noci"
                            />
                            <input
                              type="number"
                              min="0"
                              value={(roomForm.seasonalPricing.holidays?.christmas?.[nights] || 0) > 0 ? roomForm.seasonalPricing.holidays?.christmas?.[nights] : ''}
                              onChange={(e) => updateHolidayPrice('christmas', nights, parseInt(e.target.value) || 0)}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Cena (Kč)"
                            />
                            <button
                              onClick={() => removeHolidayPrice('christmas', nights)}
                              className="text-red-600 hover:text-red-800"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          const existingNights = Object.keys(roomForm.seasonalPricing.holidays?.christmas || {}).map(Number);
                          const nextNight = existingNights.length > 0 ? Math.max(...existingNights) + 1 : 4;
                          updateHolidayPrice('christmas', nextNight, 0);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Přidat cenu pro Vánoce
                      </button>
                    </div>
                  </div>

                  {/* Silvestr */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-gray-700 mb-2">Silvestr</h5>
                    <div className="space-y-2">
                      {Object.keys(roomForm.seasonalPricing.holidays?.newyear || {}).map((nightsStr) => {
                        const nights = parseInt(nightsStr);
                        return (
                          <div key={nights} className="flex gap-2 items-center">
                            <input
                              type="number"
                              min="1"
                              value={nights}
                              onChange={(e) => {
                                const newNights = parseInt(e.target.value);
                                if (newNights > 0 && newNights !== nights) {
                                  const price = roomForm.seasonalPricing.holidays?.newyear?.[nights] || 0;
                                  removeHolidayPrice('newyear', nights);
                                  updateHolidayPrice('newyear', newNights, price);
                                }
                              }}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Noci"
                            />
                            <input
                              type="number"
                              min="0"
                              value={(roomForm.seasonalPricing.holidays?.newyear?.[nights] || 0) > 0 ? roomForm.seasonalPricing.holidays?.newyear?.[nights] : ''}
                              onChange={(e) => updateHolidayPrice('newyear', nights, parseInt(e.target.value) || 0)}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Cena (Kč)"
                            />
                            <button
                              onClick={() => removeHolidayPrice('newyear', nights)}
                              className="text-red-600 hover:text-red-800"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          const existingNights = Object.keys(roomForm.seasonalPricing.holidays?.newyear || {}).map(Number);
                          const nextNight = existingNights.length > 0 ? Math.max(...existingNights) + 1 : 7;
                          updateHolidayPrice('newyear', nextNight, 0);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Přidat cenu pro Silvestr
                      </button>
                    </div>
                  </div>

                  {/* Velikonoce */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-gray-700 mb-2">Velikonoce</h5>
                    <div className="space-y-2">
                      {Object.keys(roomForm.seasonalPricing.holidays?.easter || {}).map((nightsStr) => {
                        const nights = parseInt(nightsStr);
                        return (
                          <div key={nights} className="flex gap-2 items-center">
                            <input
                              type="number"
                              min="1"
                              value={nights}
                              onChange={(e) => {
                                const newNights = parseInt(e.target.value);
                                if (newNights > 0 && newNights !== nights) {
                                  const price = roomForm.seasonalPricing.holidays?.easter?.[nights] || 0;
                                  removeHolidayPrice('easter', nights);
                                  updateHolidayPrice('easter', newNights, price);
                                }
                              }}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Noci"
                            />
                            <input
                              type="number"
                              min="0"
                              value={(roomForm.seasonalPricing.holidays?.easter?.[nights] || 0) > 0 ? roomForm.seasonalPricing.holidays?.easter?.[nights] : ''}
                              onChange={(e) => updateHolidayPrice('easter', nights, parseInt(e.target.value) || 0)}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Cena (Kč)"
                            />
                            <button
                              onClick={() => removeHolidayPrice('easter', nights)}
                              className="text-red-600 hover:text-red-800"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          const existingNights = Object.keys(roomForm.seasonalPricing.holidays?.easter || {}).map(Number);
                          const nextNight = existingNights.length > 0 ? Math.max(...existingNights) + 1 : 5;
                          updateHolidayPrice('easter', nextNight, 0);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Přidat cenu pro Velikonoce
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSaveRoom}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Uložit
              </button>
              <button
                onClick={() => setShowRoomForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300"
              >
                Zrušit
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seznam pokojů */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Pokoje</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedRoom?.id === room.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedRoom(room)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{room.name}</h3>
                        <p className="text-sm text-gray-500">
                          {room.capacity} {room.capacity === 1 ? 'osoba' : room.capacity < 5 ? 'osoby' : 'osob'} • {
                            room.pricingModel === 'seasonal' 
                              ? 'Sezónní ceník'
                              : `${room.pricePerNight} Kč/noc`
                          }
                        </p>
                        {!room.available && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                            Nedostupný
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRoom(room);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRoom(room.id);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Kalendář pro vybraný pokoj */}
          <div className="lg:col-span-2">
            {selectedRoom ? (
              <AdminRoomCalendar room={selectedRoom} />
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">Vyberte pokoj pro zobrazení kalendáře a správy blokací</p>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
