import { useState, useEffect } from 'react';
import { format, parseISO, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isBefore, isAfter, isSameDay } from 'date-fns';
import { cs } from 'date-fns/locale/cs';
import { blocksAPI, calendarAPI } from '../../api/api';
import type { Room, Block, Reservation, HalfDay } from '../../types';
import { formatDateISO, getHalfDaysForReservation, isPastDate, getDatesBetween } from '../../utils/dateUtils';

interface AdminRoomCalendarProps {
  room: Room;
}

export default function AdminRoomCalendar({ room }: AdminRoomCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockRangeStart, setBlockRangeStart] = useState<string | null>(null);
  const [blockRangeEnd, setBlockRangeEnd] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('Údržba');

  useEffect(() => {
    loadCalendarData();
  }, [room.id, currentMonth]);

  async function loadCalendarData() {
    try {
      setLoading(true);
      const [reservationsRes, blocksRes] = await Promise.all([
        calendarAPI.getRoomCalendar(room.id),
        blocksAPI.getAll(room.id),
      ]);
      
      setReservations(reservationsRes.reservations || []);
      setBlocks(blocksRes.blocks || []);
    } catch (error) {
      console.error('Chyba při načítání kalendáře:', error);
    } finally {
      setLoading(false);
    }
  }

  function getDayStatus(date: Date) {
    const dateStr = formatDateISO(date);
    const isPast = isPastDate(dateStr);

    // Rezervace
    const reservedHalfDays = new Set<string>();
    reservations.forEach(res => {
      if (res.status !== 'cancelled') {
        const halfDays = getHalfDaysForReservation(res.checkIn, res.checkOut);
        halfDays.forEach(hd => {
          if (hd.date === dateStr) {
            reservedHalfDays.add(hd.halfDay);
          }
        });
      }
    });

    // Blokace
    const blockedHalfDays = new Set<string>();
    blocks.forEach(block => {
      if (block.date === dateStr) {
        blockedHalfDays.add(block.halfDay);
      }
    });

    return {
      date: dateStr,
      am: {
        reserved: reservedHalfDays.has('AM'),
        blocked: blockedHalfDays.has('AM'),
        past: isPast,
      },
      pm: {
        reserved: reservedHalfDays.has('PM'),
        blocked: blockedHalfDays.has('PM'),
        past: isPast,
      },
    };
  }

  async function handleToggleBlock(date: string, halfDay: HalfDay) {
    const existingBlock = blocks.find(
      b => b.date === date && b.halfDay === halfDay
    );

    try {
      if (existingBlock) {
        // Odstranit blokaci
        await blocksAPI.delete(existingBlock.id);
      } else {
        // Přidat blokaci
        await blocksAPI.create({
          roomId: room.id,
          date,
          halfDay,
          reason: blockReason,
        });
      }
      await loadCalendarData();
    } catch (error) {
      alert('Nepodařilo se upravit blokaci.');
    }
  }

  async function handleBlockWholeDay(date: string) {
    const dateStr = formatDateISO(parseISO(date));
    if (isPastDate(dateStr)) return;

    const status = getDayStatus(parseISO(date));
    
    // Zkontrolujeme, zda je celý den volný (ne rezervovaný)
    if (status.am.reserved || status.pm.reserved) {
      alert('Nelze blokovat den s rezervací.');
      return;
    }

    try {
      // Pokud je AM blokované, odstraníme ho, jinak přidáme
      const amBlock = blocks.find(b => b.date === dateStr && b.halfDay === 'AM');
      if (amBlock) {
        await blocksAPI.delete(amBlock.id);
      } else {
        await blocksAPI.create({
          roomId: room.id,
          date: dateStr,
          halfDay: 'AM',
          reason: blockReason,
        });
      }

      // Pokud je PM blokované, odstraníme ho, jinak přidáme
      const pmBlock = blocks.find(b => b.date === dateStr && b.halfDay === 'PM');
      if (pmBlock) {
        await blocksAPI.delete(pmBlock.id);
      } else {
        await blocksAPI.create({
          roomId: room.id,
          date: dateStr,
          halfDay: 'PM',
          reason: blockReason,
        });
      }

      await loadCalendarData();
    } catch (error) {
      alert('Nepodařilo se upravit blokaci.');
    }
  }

  async function handleBlockRange() {
    if (!blockRangeStart || !blockRangeEnd) {
      alert('Vyberte rozsah dat pro blokaci.');
      return;
    }

    const startDate = parseISO(blockRangeStart);
    const endDate = parseISO(blockRangeEnd);

    if (isAfter(startDate, endDate)) {
      alert('Datum začátku musí být před datem konce.');
      return;
    }

    const dates = getDatesBetween(blockRangeStart, blockRangeEnd);
    
    // Zkontrolujeme, zda nejsou některé dny rezervované
    for (const dateStr of dates) {
      const status = getDayStatus(parseISO(dateStr));
      if (status.am.reserved || status.pm.reserved) {
        alert(`Datum ${dateStr} má rezervaci. Nelze blokovat.`);
        return;
      }
    }

    try {
      // Blokujeme všechny dny v rozsahu
      for (const dateStr of dates) {
        // Blokujeme AM, pokud není už blokované
        const amBlock = blocks.find(b => b.date === dateStr && b.halfDay === 'AM');
        if (!amBlock) {
          await blocksAPI.create({
            roomId: room.id,
            date: dateStr,
            halfDay: 'AM',
            reason: blockReason,
          });
        }

        // Blokujeme PM, pokud není už blokované
        const pmBlock = blocks.find(b => b.date === dateStr && b.halfDay === 'PM');
        if (!pmBlock) {
          await blocksAPI.create({
            roomId: room.id,
            date: dateStr,
            halfDay: 'PM',
            reason: blockReason,
          });
        }
      }

      await loadCalendarData();
      setBlockRangeStart(null);
      setBlockRangeEnd(null);
      alert('Rozsah dat byl úspěšně zablokován.');
    } catch (error) {
      alert('Nepodařilo se blokovat rozsah dat.');
    }
  }

  function isDayFullyBlocked(date: Date): boolean {
    const status = getDayStatus(date);
    return status.am.blocked && status.pm.blocked;
  }

  function isInBlockRange(date: Date): boolean {
    if (!blockRangeStart || !blockRangeEnd) return false;
    const dateStr = formatDateISO(date);
    const start = parseISO(blockRangeStart);
    const end = parseISO(blockRangeEnd);
    const current = parseISO(dateStr);
    return (isAfter(current, start) || isSameDay(current, start)) && 
           (isBefore(current, end) || isSameDay(current, end));
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Kalendář: {room.name}
      </h2>

      {/* Blokování rozsahu */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">Blokovat rozsah dat (údržba)</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Důvod blokace</label>
            <input
              type="text"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              placeholder="Údržba"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Od data</label>
            <input
              type="date"
              value={blockRangeStart || ''}
              onChange={(e) => setBlockRangeStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Do data</label>
            <input
              type="date"
              value={blockRangeEnd || ''}
              onChange={(e) => setBlockRangeEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleBlockRange}
              disabled={!blockRangeStart || !blockRangeEnd}
              className="w-full bg-yellow-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Blokovat rozsah
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
          className="p-2 hover:bg-gray-100 rounded"
        >
          ←
        </button>
        <h3 className="text-lg font-semibold">
          {format(currentMonth, 'LLLL yyyy', { locale: cs })}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded"
        >
          →
        </button>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-300"></div>
          <span>Volné</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border border-red-300"></div>
          <span>Rezervováno</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 border border-yellow-300"></div>
          <span>Blokováno</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-100 border border-orange-300"></div>
          <span>Celý den blokován</span>
        </div>
      </div>

      {/* Kalendář */}
      <div className="grid grid-cols-7 gap-1">
        {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((day) => (
          <div key={day} className="text-center font-semibold text-gray-700 py-2">
            {day}
          </div>
        ))}

        {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
          <div key={`empty-${i}`} className="p-2"></div>
        ))}

        {days.map((date) => {
          const status = getDayStatus(date);
          const isPast = status.am.past;
          const fullyBlocked = isDayFullyBlocked(date);
          const inRange = isInBlockRange(date);
          
          return (
            <div
              key={date.toISOString()}
              className={`p-2 border border-gray-200 min-h-[100px] ${
                !isSameMonth(date, currentMonth) ? 'bg-gray-50' : 'bg-white'
              } ${fullyBlocked ? 'bg-orange-50 border-orange-300' : ''} ${inRange ? 'ring-2 ring-blue-400' : ''}`}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm font-medium">
                  {format(date, 'd')}
                </div>
                {!isPast && !status.am.reserved && !status.pm.reserved && (
                  <button
                    onClick={() => handleBlockWholeDay(status.date)}
                    className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                    title={fullyBlocked ? 'Odblokovat celý den' : 'Blokovat celý den'}
                  >
                    {fullyBlocked ? '🔓' : '🔒'}
                  </button>
                )}
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => !isPast && handleToggleBlock(status.date, 'AM')}
                  disabled={isPast || status.am.reserved}
                  className={`w-full text-xs px-1 py-1 rounded ${
                    status.am.reserved
                      ? 'bg-red-100 text-red-800 cursor-not-allowed'
                      : status.am.blocked
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : isPast
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                  title={status.am.reserved ? 'Rezervováno' : status.am.blocked ? 'Klikněte pro odblokování' : 'Klikněte pro blokování'}
                >
                  AM
                </button>
                <button
                  onClick={() => !isPast && handleToggleBlock(status.date, 'PM')}
                  disabled={isPast || status.pm.reserved}
                  className={`w-full text-xs px-1 py-1 rounded ${
                    status.pm.reserved
                      ? 'bg-red-100 text-red-800 cursor-not-allowed'
                      : status.pm.blocked
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : isPast
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                  title={status.pm.reserved ? 'Rezervováno' : status.pm.blocked ? 'Klikněte pro odblokování' : 'Klikněte pro blokování'}
                >
                  PM
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
        <p className="font-semibold mb-2">Jak blokovat:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Celý den:</strong> Klikněte na ikonu 🔒 vedle data pro blokování celého dne (AM+PM)</li>
          <li><strong>Půl dne:</strong> Klikněte na volné AM nebo PM pro blokování jednotlivého půldne</li>
          <li><strong>Rozsah dat:</strong> Vyberte rozsah dat nahoře a klikněte na "Blokovat rozsah"</li>
          <li>Kliknutím znovu na blokované odblokujete</li>
          <li>Rezervované půlky dne nelze blokovat</li>
        </ul>
      </div>
    </div>
  );
}
