import { useState } from 'react';
import { format, parseISO, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isBefore, isAfter } from 'date-fns';
import { cs } from 'date-fns/locale/cs';
import type { Reservation, Block, DayStatus } from '../types';
import { getHalfDaysForReservation, isPastDate, formatDateISO } from '../utils/dateUtils';

interface CalendarProps {
  roomId: string;
  reservations: Reservation[];
  blocks: Block[];
  selectedCheckIn: string | null;
  selectedCheckOut: string | null;
  onCheckInSelect: (date: string) => void;
  onCheckOutSelect: (date: string | '') => void;
}

export default function Calendar({
  roomId,
  reservations,
  blocks,
  selectedCheckIn,
  selectedCheckOut,
  onCheckInSelect,
  onCheckOutSelect,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Získání stavu pro konkrétní den
  function getDayStatus(date: Date): DayStatus {
    const dateStr = formatDateISO(date);
    const isPast = isPastDate(dateStr);

    // Získání všech půldnů pro rezervace
    const reservedHalfDays = new Set<string>();
    reservations.forEach(res => {
      if (res.roomId === roomId && res.status !== 'cancelled') {
        const halfDays = getHalfDaysForReservation(res.checkIn, res.checkOut);
        halfDays.forEach(hd => {
          if (hd.date === dateStr) {
            reservedHalfDays.add(hd.halfDay);
          }
        });
      }
    });

    // Získání blokovaných půldnů
    const blockedHalfDays = new Set<string>();
    blocks.forEach(block => {
      if (block.roomId === roomId && block.date === dateStr) {
        blockedHalfDays.add(block.halfDay);
      }
    });

    const amStatus = isPast || blockedHalfDays.has('AM') || reservedHalfDays.has('AM')
      ? (isPast ? 'past' : blockedHalfDays.has('AM') ? 'blocked' : 'reserved')
      : 'available';

    const pmStatus = isPast || blockedHalfDays.has('PM') || reservedHalfDays.has('PM')
      ? (isPast ? 'past' : blockedHalfDays.has('PM') ? 'blocked' : 'reserved')
      : 'available';

    return { date: dateStr, am: amStatus, pm: pmStatus };
  }

  // Zkontroluje, zda je den vybraný jako příjezd
  function isCheckIn(date: Date): boolean {
    if (!selectedCheckIn) return false;
    const dateStr = formatDateISO(date);
    return dateStr === selectedCheckIn;
  }

  // Zkontroluje, zda je den vybraný jako odjezd
  function isCheckOut(date: Date): boolean {
    if (!selectedCheckOut) return false;
    const dateStr = formatDateISO(date);
    return dateStr === selectedCheckOut;
  }

  // Zkontroluje, zda je den v rozsahu výběru (mezi příjezdem a odjezdem)
  function isInRange(date: Date): boolean {
    if (!selectedCheckIn || !selectedCheckOut) return false;
    const dateStr = formatDateISO(date);
    const checkIn = parseISO(selectedCheckIn);
    const checkOut = parseISO(selectedCheckOut);
    const current = parseISO(dateStr);
    return isAfter(current, checkIn) && isBefore(current, checkOut);
  }

  function handleDayClick(date: Date) {
    const dateStr = formatDateISO(date);
    if (isPastDate(dateStr)) return;

    // Pokud máme vybraný příjezd i odjezd, resetujeme a začneme nový výběr
    if (selectedCheckIn && selectedCheckOut) {
      onCheckInSelect(dateStr);
      onCheckOutSelect('');
      return;
    }

    // Pokud nemáme vybraný příjezd, vybereme ho
    if (!selectedCheckIn) {
      onCheckInSelect(dateStr);
      return;
    }

    // Pokud máme vybraný příjezd, ale ne odjezd
    if (selectedCheckIn && !selectedCheckOut) {
      const checkInDate = parseISO(selectedCheckIn);
      const clickedDate = parseISO(dateStr);

      // Pokud klikneme na datum před příjezdem, nastavíme nový příjezd
      if (isBefore(clickedDate, checkInDate) || isSameDay(clickedDate, checkInDate)) {
        onCheckInSelect(dateStr);
        onCheckOutSelect('');
      } else {
        // Jinak nastavíme odjezd
        onCheckOutSelect(dateStr);
      }
    }
  }

  function getDayClassName(date: Date, _status: DayStatus): string {
    let classes = 'relative p-1.5 border border-gray-200 min-h-[70px] cursor-pointer transition-colors ';
    
    if (!isSameMonth(date, currentMonth)) {
      classes += 'bg-gray-50 text-gray-400 ';
    } else if (isPastDate(formatDateISO(date))) {
      classes += 'bg-gray-200 text-gray-500 cursor-not-allowed ';
    } else {
      classes += 'bg-white hover:bg-gray-50 ';
    }

    // Vizuální propojení - dny mezi příjezdem a odjezdem
    if (isInRange(date)) {
      classes += 'bg-blue-300 border-blue-500 ';
    }

    // Příjezd - zelený rámeček (pozadí se nastaví inline stylem)
    if (isCheckIn(date)) {
      classes += 'ring-2 ring-green-600 ring-inset border-green-500 ';
    }

    // Odjezd - červený rámeček
    if (isCheckOut(date)) {
      classes += 'ring-2 ring-red-600 ring-inset bg-red-200 border-red-500 ';
    }

    return classes;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
          className="p-1 hover:bg-gray-100 rounded text-lg"
        >
          ←
        </button>
        <h3 className="text-lg font-bold">
          {format(currentMonth, 'LLLL yyyy', { locale: cs })}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1 hover:bg-gray-100 rounded text-lg"
        >
          →
        </button>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 border border-green-600" style={{ backgroundColor: '#38cc50' }}></div>
          <span>Volné</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-red-400 border border-red-600"></div>
          <span>Obsazené</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-yellow-400 border border-yellow-600"></div>
          <span>Blokované</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-gray-400"></div>
          <span>Minulé</span>
        </div>
        {selectedCheckIn && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 border-2 border-green-600" style={{ backgroundColor: '#38cc50', opacity: 0.6 }}></div>
            <span>Příjezd</span>
          </div>
        )}
        {selectedCheckOut && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-red-200 border-2 border-red-600"></div>
            <span>Odjezd</span>
          </div>
        )}
        {selectedCheckIn && selectedCheckOut && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-blue-300 border border-blue-600"></div>
            <span>Dny pobytu</span>
          </div>
        )}
      </div>

      {/* Kalendář */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Hlavičky dnů */}
        {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((day) => (
          <div key={day} className="text-center font-semibold text-gray-700 py-1 text-xs">
            {day}
          </div>
        ))}

        {/* Prázdné buňky na začátku měsíce */}
        {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
          <div key={`empty-${i}`} className="p-1.5"></div>
        ))}

        {/* Dny */}
        {days.map((date) => {
          const status = getDayStatus(date);
          const isCheckInDay = isCheckIn(date);
          const isCheckOutDay = isCheckOut(date);
          const isInRangeDay = isInRange(date);
          
          return (
            <div
              key={date.toISOString()}
              onClick={() => handleDayClick(date)}
              className={getDayClassName(date, status)}
              style={isCheckInDay ? { backgroundColor: 'rgba(56, 204, 80, 0.3)' } : {}}
            >
              <div className="text-xs font-medium mb-0.5">
                {format(date, 'd')}
              </div>
              <div className="space-y-0.5">
                <div
                  className={`text-[10px] px-0.5 py-0.5 rounded font-semibold border ${
                    status.am === 'available'
                      ? 'text-green-900 border-green-600'
                      : status.am === 'reserved'
                      ? 'bg-red-400 text-red-900 border border-red-600'
                      : status.am === 'blocked'
                      ? 'bg-yellow-400 text-yellow-900 border border-yellow-600'
                      : 'bg-gray-400 text-gray-700'
                  } ${isCheckOutDay ? 'font-bold ring-1 ring-red-600' : ''}`}
                  style={status.am === 'available' ? { backgroundColor: '#38cc50' } : {}}
                >
                  AM{isCheckOutDay ? ' (odjezd)' : ''}
                </div>
                <div
                  className={`text-[10px] px-0.5 py-0.5 rounded font-semibold border ${
                    status.pm === 'available'
                      ? 'text-green-900 border-green-600'
                      : status.pm === 'reserved'
                      ? 'bg-red-400 text-red-900 border border-red-600'
                      : status.pm === 'blocked'
                      ? 'bg-yellow-400 text-yellow-900 border border-yellow-600'
                      : 'bg-gray-400 text-gray-700'
                  } ${isCheckInDay ? 'font-bold ring-1 ring-green-600' : ''}`}
                  style={status.pm === 'available' ? { backgroundColor: '#38cc50' } : {}}
                >
                  PM{isCheckInDay ? ' (příjezd)' : ''}
                </div>
              </div>
              {isInRangeDay && (
                <div className="absolute inset-0 bg-blue-400 opacity-30 pointer-events-none"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Vysvětlení */}
      <div className="mt-4 p-3 rounded-lg text-xs text-gray-800" style={{ backgroundColor: '#e5e7eb' }}>
        <p className="font-semibold mb-1.5">Jak rezervovat:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Klikněte na datum <strong>příjezdu</strong> (zelený rámeček, obsadí se PM)</li>
          <li>Klikněte na datum <strong>odjezdu</strong> (červený rámeček, obsadí se AM)</li>
          <li>Dny mezi tím se automaticky označí modře (AM+PM)</li>
          <li>Pro změnu termínu klikněte na nový datum - výběr se resetuje</li>
        </ul>
      </div>
    </div>
  );
}
