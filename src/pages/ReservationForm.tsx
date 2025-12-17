import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Calendar from '../components/Calendar';
import { roomsAPI, reservationsAPI, calendarAPI } from '../api/api';
import { validateReservation } from '../utils/reservationValidation';
import { calculateNights as calcNights } from '../utils/dateUtils';
import { calculateReservationPrice, getMinimumStay } from '../utils/priceCalculation';
import type { Room, Reservation, Block, CreateReservationData } from '../types';
import ReservationConfirmationModal from './ReservationConfirmationModal';

export default function ReservationForm() {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const locationState = location.state as { roomId?: string } | null;
  const stateRoomId = locationState?.roomId;
  const effectiveRoomId = roomId || stateRoomId || null;
  const navigate = useNavigate();
  // PREZENTAČNÍ ÚPRAVA: navigate je potřeba pro přesměrování z neplatného roomId
  
  const [room, setRoom] = useState<Room | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedCheckIn, setSelectedCheckIn] = useState<string | null>(null);
  const [selectedCheckOut, setSelectedCheckOut] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    numberOfGuests: 1,
    note: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedReservationId, setConfirmedReservationId] = useState<string | null>(null);
  const [confirmedReservation, setConfirmedReservation] = useState<any | null>(null);

  // Oprava pro mobilní klávesnici - automatické scrollování při focus
  useEffect(() => {
    const handleFocus = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        // Detekce mobilního zařízení - musí být před setTimeout
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // Použij requestAnimationFrame pro lepší synchronizaci s klávesnicí
        requestAnimationFrame(() => {
          // Počkej, až se klávesnice otevře (různé mobily mají různou rychlost)
          setTimeout(() => {
            if (isMobile) {
              // Na mobilu scrolluj s větším offsetem a rychleji
              const elementRect = target.getBoundingClientRect();
              const absoluteElementTop = elementRect.top + window.pageYOffset;
              const offset = 100; // Offset od vrchu viewportu
              
              window.scrollTo({
                top: absoluteElementTop - offset,
                behavior: 'smooth'
              });
            } else {
              // Na desktopu použij klasický scrollIntoView
              target.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
              });
            }
          }, isMobile ? 500 : 100); // Na mobilu počkej déle
        });
      }
    };

    // Přidej event listener na všechny inputy a textarey
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('focus', handleFocus as EventListener, { passive: true });
    });

    return () => {
      inputs.forEach(input => {
        input.removeEventListener('focus', handleFocus as EventListener);
      });
    };
  }, [room]); // Re-run když se načte pokoj

  // PREZENTAČNÍ ÚPRAVA: Načteme první dostupný pokoj, pokud není roomId v URL nebo pokud roomId není platné ID pokoje
  useEffect(() => {
    if (effectiveRoomId) {
      // Zkontroluj, jestli roomId je skutečně ID pokoje (ne UUID rezervace)
      // Pokud je to UUID, ale není to ID pokoje, přesměruj na root a načti první dostupný pokoj
      loadDataOrFirstAvailable(effectiveRoomId);
    } else {
      // Pokud není roomId, načteme první dostupný pokoj
      loadFirstAvailableRoom();
    }
  }, [effectiveRoomId, navigate]);
  
  async function loadDataOrFirstAvailable(requestedRoomId: string) {
    try {
      setLoading(true);
      // Zkus načíst pokoj s tímto ID
      const roomRes = await roomsAPI.getById(requestedRoomId);
      
      // Pokud pokoj existuje, načti data
      if (roomRes.room) {
        const calendarRes = await calendarAPI.getRoomCalendar(requestedRoomId);
        setRoom(roomRes.room);
        setReservations(calendarRes.reservations || []);
        setBlocks(calendarRes.blocks || []);
      } else {
        // Pokud pokoj neexistuje, načti první dostupný
        loadFirstAvailableRoom();
      }
    } catch (error) {
      // Pokud se nepodařilo načíst pokoj (404 nebo jiná chyba), přesměruj na root a načti první dostupný
      console.log('Room not found, redirecting to /penzion and loading first available room');
      // Přesměruj na hlavní stránku formuláře pro penzion (bez roomId)
      navigate('/penzion', { replace: true, state: null });
      loadFirstAvailableRoom();
    } finally {
      setLoading(false);
    }
  }

  async function loadFirstAvailableRoom() {
    try {
      setLoading(true);
      const response = await roomsAPI.getAll();
      const availableRooms = response.rooms.filter((room: Room) => room.available);
      
      if (availableRooms.length > 0 && availableRooms[0]?.id) {
        const firstRoomId = availableRooms[0].id;
        // Načteme data pro první pokoj
        const [roomRes, calendarRes] = await Promise.all([
          roomsAPI.getById(firstRoomId),
          calendarAPI.getRoomCalendar(firstRoomId),
        ]);
        
        setRoom(roomRes.room);
        setReservations(calendarRes.reservations || []);
        setBlocks(calendarRes.blocks || []);
      } else {
        setError('Momentálně nejsou k dispozici žádné pokoje.');
      }
    } catch (error) {
      console.error('Chyba při načítání pokojů:', error);
      setError('Nepodařilo se načíst pokoje. Zkuste to prosím později.');
    } finally {
      setLoading(false);
    }
  }


  function handleCheckInSelect(date: string) {
    setSelectedCheckIn(date);
    setSelectedCheckOut(null);
    setErrors({});
  }

  function handleCheckOutSelect(date: string) {
    setSelectedCheckOut(date);
    setErrors({});
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'numberOfGuests' ? parseInt(value) || 1 : value,
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!room || !selectedCheckIn || !selectedCheckOut) {
      setErrors({ general: 'Vyberte prosím termín pobytu.' });
      return;
    }

    const reservationData: CreateReservationData = {
      roomId: room.id,
      checkIn: selectedCheckIn,
      checkOut: selectedCheckOut,
      ...formData,
    };

    // Validace
    const validation = validateReservation(reservationData, room, reservations, blocks);
    if (!validation.valid) {
      setErrors({ general: validation.errors.join(', ') });
      return;
    }

    // Výpočet ceny
    const nights = calcNights(selectedCheckIn, selectedCheckOut);
    const totalPrice = calculateReservationPrice(room, selectedCheckIn, selectedCheckOut);

    try {
      setSubmitting(true);
      const response = await reservationsAPI.create({
        ...reservationData,
        nights,
        totalPrice,
        bookingType: 'guesthouse', // Penzion varianta - se zálohou
      });
      
      console.log('Rezervace vytvořena:', response);
      
      // PREZENTAČNÍ ÚPRAVA: Zobrazit modal místo navigace na novou stránku
      // Ověříme, že response obsahuje reservation.id
      if (!response?.reservation?.id) {
        console.error('Response neobsahuje reservation.id:', response);
        setErrors({ general: 'Rezervace byla vytvořena, ale nepodařilo se získat ID rezervace.' });
        setSubmitting(false);
        return;
      }
      
      // Zobrazíme modal s potvrzením - nejdřív reset formuláře, pak zobraz modal
      const reservationId = response.reservation.id;
      console.log('Zobrazuji modal pro rezervaci:', reservationId);
      
      // Reset formuláře
      setSelectedCheckIn(null);
      setSelectedCheckOut(null);
      setFormData({
        guestName: '',
        guestPhone: '',
        guestEmail: '',
        numberOfGuests: 1,
        note: '',
      });
      
      // Zobrazíme modal - předáme i data rezervace, aby se nemusela znovu načítat
      setConfirmedReservationId(reservationId);
      setConfirmedReservation(response.reservation); // Předáme data rezervace přímo
      setShowConfirmation(true);
      setSubmitting(false);
    } catch (error: any) {
      console.error('Chyba při vytváření rezervace:', error);
      setErrors({ general: error.message || 'Nepodařilo se vytvořit rezervaci. Zkuste to prosím později.' });
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Načítání...</p>
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Pokoj nenalezen.</p>
        </div>
      </div>
    );
  }

  const nights = selectedCheckIn && selectedCheckOut 
    ? calcNights(selectedCheckIn, selectedCheckOut) 
    : 0;
  const totalPrice = selectedCheckIn && selectedCheckOut
    ? calculateReservationPrice(room, selectedCheckIn, selectedCheckOut)
    : 0;

  return (
    // PREZENTAČNÍ ÚPRAVA: Snížený padding pro minimalizaci výšky
    // Pro návrat k původnímu stavu: změnit py-4 na py-12, mb-4 na mb-8, gap-6 na gap-8, space-y-4 na space-y-6, p-4 na p-6
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="mb-4 text-center pt-8 sm:pt-4">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="h-px bg-[#a04e27] flex-1 max-w-[100px]"></div>
          <h1 className="text-[28px] font-bold italic" style={{ fontFamily: 'Playfair Display', color: '#a04e27' }}>
            Rezervační formulář
          </h1>
          <div className="h-px bg-[#a04e27] flex-1 max-w-[100px]"></div>
        </div>
        <div className="text-gray-600 space-y-1">
          <p className="text-xs">
            Zaplacením pobytu je v souladu se Všeobecnými obchodními podmínkami je pronájem závazně rezervován.
          </p>
          <p className="text-xs">
            <a href="#" className="text-blue-600 hover:text-blue-800 underline">Všeobecné obchodní podmínky</a> ;{' '}
            <a href="#" className="text-blue-600 hover:text-blue-800 underline">Zásady ochrany osobních údajů</a>
          </p>
        </div>
      </div>

      {/* PREZENTAČNÍ ÚPRAVA: Grid s items-stretch pro srovnání výšky obou sloupců */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Kalendář */}
        <div className="flex flex-col">
          {room.pricingModel === 'seasonal' && (
            <div className="mb-3 p-2 rounded-lg" style={{ backgroundColor: '#e5e7eb' }}>
              <p className="text-xs" style={{ color: '#000000' }}>
                <strong>Minimální doba pobytu:</strong> {getMinimumStay(room)} {getMinimumStay(room) === 1 ? 'noc' : getMinimumStay(room) < 5 ? 'noci' : 'nocí'}
              </p>
            </div>
          )}
          <div className="flex-1">
            <Calendar
              roomId={room.id}
              reservations={reservations}
              blocks={blocks}
              selectedCheckIn={selectedCheckIn}
              selectedCheckOut={selectedCheckOut}
              onCheckInSelect={handleCheckInSelect}
              onCheckOutSelect={handleCheckOutSelect}
            />
          </div>
        </div>

        {/* Formulář */}
        {/* PREZENTAČNÍ ÚPRAVA: Snížené mezery pro minimalizaci výšky */}
        <div className="flex flex-col">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-3 space-y-3 h-full flex flex-col">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Výběr termínu */}
            <div>
              <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 'normal', color: '#000000' }}>
                Termín pobytu
              </label>
              {selectedCheckIn && selectedCheckOut ? (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#000000' }}>
                    <strong>Příjezd:</strong> {new Date(selectedCheckIn).toLocaleDateString('cs-CZ')} (PM)
                  </p>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#000000' }} className="mt-1">
                    <strong>Odjezd:</strong> {new Date(selectedCheckOut).toLocaleDateString('cs-CZ')} (AM)
                  </p>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#000000' }} className="mt-2">
                    <strong>Počet nocí:</strong> {nights}
                    {room.pricingModel === 'seasonal' && nights < getMinimumStay(room) && (
                      <span className="ml-2 text-red-600 font-medium">
                        (minimálně {getMinimumStay(room)} {getMinimumStay(room) === 1 ? 'noc' : getMinimumStay(room) < 5 ? 'noci' : 'nocí'})
                      </span>
                    )}
                  </p>
                  <p className="text-lg font-bold mt-2" style={{ color: '#a04e27' }}>
                    Celková cena: {totalPrice} Kč
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#000000' }}>
                  {selectedCheckIn 
                    ? 'Vyberte datum odjezdu' 
                    : 'Vyberte datum příjezdu v kalendáři'}
                </p>
              )}
            </div>

            {/* Jméno */}
            <div>
              <label htmlFor="guestName" className="block mb-2" style={{ fontSize: '14px', fontWeight: 'normal', color: '#000000' }}>
                Jméno a příjmení *
              </label>
              <input
                type="text"
                id="guestName"
                name="guestName"
                value={formData.guestName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ fontSize: '14px', fontWeight: 'bold', color: '#000000' }}
                onFocus={() => {
                  // Globální handler se postará o scrollování
                }}
              />
              {errors.guestName && (
                <p className="mt-1 text-sm text-red-600">{errors.guestName}</p>
              )}
            </div>

            {/* Telefon */}
            <div>
              <label htmlFor="guestPhone" className="block mb-2" style={{ fontSize: '14px', fontWeight: 'normal', color: '#000000' }}>
                Telefon *
              </label>
              <input
                type="tel"
                id="guestPhone"
                name="guestPhone"
                value={formData.guestPhone}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ fontSize: '14px', fontWeight: 'bold', color: '#000000' }}
                onFocus={() => {
                  // Globální handler se postará o scrollování
                }}
              />
              {errors.guestPhone && (
                <p className="mt-1 text-sm text-red-600">{errors.guestPhone}</p>
              )}
            </div>

            {/* E-mail */}
            <div>
              <label htmlFor="guestEmail" className="block mb-2" style={{ fontSize: '14px', fontWeight: 'normal', color: '#000000' }}>
                E-mail *
              </label>
              <input
                type="email"
                id="guestEmail"
                name="guestEmail"
                value={formData.guestEmail}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ fontSize: '14px', fontWeight: 'bold', color: '#000000' }}
                onFocus={() => {
                  // Globální handler se postará o scrollování
                }}
              />
              {errors.guestEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.guestEmail}</p>
              )}
            </div>

            {/* Počet osob */}
            <div>
              <label htmlFor="numberOfGuests" className="block mb-2" style={{ fontSize: '14px', fontWeight: 'normal', color: '#000000' }}>
                Počet osob *
              </label>
              <input
                type="number"
                id="numberOfGuests"
                name="numberOfGuests"
                min="1"
                max={room.capacity}
                value={formData.numberOfGuests}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ fontSize: '14px', fontWeight: 'bold', color: '#000000' }}
                onFocus={() => {
                  // Globální handler se postará o scrollování
                }}
              />
              {errors.numberOfGuests && (
                <p className="mt-1 text-sm text-red-600">{errors.numberOfGuests}</p>
              )}
            </div>

            {/* Poznámka */}
            {/* PREZENTAČNÍ ÚPRAVA: Zvětšené pole Poznámka pro zarovnání tlačítka se spodním okrajem šedého boxíku v kalendáři */}
            <div className="flex-1 flex flex-col">
              <label htmlFor="note" className="block mb-2" style={{ fontSize: '14px', fontWeight: 'normal', color: '#000000' }}>
                Poznámka
              </label>
              <textarea
                id="note"
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1 resize-none"
                style={{ fontSize: '14px', fontWeight: 'bold', color: '#000000' }}
                onFocus={() => {
                  // Globální handler se postará o scrollování
                }}
              />
            </div>

            {/* Tlačítko odeslat */}
            <div className="mt-auto">
              <button
                type="submit"
                disabled={submitting || !selectedCheckIn || !selectedCheckOut}
                className="w-full text-white py-3 rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: submitting || !selectedCheckIn || !selectedCheckOut ? undefined : '#a04e27',
                ...(submitting || !selectedCheckIn || !selectedCheckOut ? {} : { '--hover-bg': '#8a3f1f' } as React.CSSProperties)
              }}
              onMouseEnter={(e) => {
                if (!submitting && selectedCheckIn && selectedCheckOut) {
                  e.currentTarget.style.backgroundColor = '#8a3f1f';
                }
              }}
              onMouseLeave={(e) => {
                if (!submitting && selectedCheckIn && selectedCheckOut) {
                  e.currentTarget.style.backgroundColor = '#a04e27';
                }
              }}
              >
                {submitting ? 'Odesílání...' : 'Odeslat rezervaci'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* PREZENTAČNÍ ÚPRAVA: Modal s potvrzením rezervace místo navigace na novou stránku */}
      {showConfirmation && confirmedReservationId && (
        <ReservationConfirmationModal
          reservationId={confirmedReservationId}
          reservation={confirmedReservation} // Předáme data rezervace přímo, aby se nemusela znovu načítat
          onClose={() => {
            setShowConfirmation(false);
            setConfirmedReservationId(null);
            setConfirmedReservation(null);
          }}
        />
      )}
    </div>
  );
}

