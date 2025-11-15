import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';
import { roomsAPI, reservationsAPI, calendarAPI } from '../api/api';
import { validateReservation } from '../utils/reservationValidation';
import { calculateNights as calcNights } from '../utils/dateUtils';
import { calculateReservationPrice, getMinimumStay } from '../utils/priceCalculation';
import type { Room, Reservation, Block, CreateReservationData } from '../types';

export default function ReservationForm() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
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

  useEffect(() => {
    if (roomId) {
      loadData();
    }
  }, [roomId]);

  async function loadData() {
    if (!roomId) return;
    
    try {
      setLoading(true);
      const [roomRes, calendarRes] = await Promise.all([
        roomsAPI.getById(roomId),
        calendarAPI.getRoomCalendar(roomId),
      ]);
      
      setRoom(roomRes.room);
      setReservations(calendarRes.reservations || []);
      setBlocks(calendarRes.blocks || []);
    } catch (error) {
      console.error('Chyba při načítání dat:', error);
      alert('Nepodařilo se načíst data. Zkuste to prosím později.');
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
      });
      
      navigate(`/potvrzeni/${response.reservation.id}`);
    } catch (error: any) {
      setErrors({ general: error.message || 'Nepodařilo se vytvořit rezervaci. Zkuste to prosím později.' });
    } finally {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="h-px bg-[#a04e27] flex-1 max-w-[100px]"></div>
          <h1 className="text-[32px] font-bold italic" style={{ fontFamily: 'Playfair Display', color: '#a04e27' }}>
            Rezervační formulář
          </h1>
          <div className="h-px bg-[#a04e27] flex-1 max-w-[100px]"></div>
        </div>
        <div className="text-gray-600 space-y-2">
          <p className="text-sm">
            Zaplacením pobytu je v souladu se Všeobecnými obchodními podmínkami je pronájem závazně rezervován.
          </p>
          <p className="text-sm">
            <a href="#" className="text-blue-600 hover:text-blue-800 underline">Všeobecné obchodní podmínky</a> ;{' '}
            <a href="#" className="text-blue-600 hover:text-blue-800 underline">Zásady ochrany osobních údajů</a>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Kalendář */}
        <div>
          {room.pricingModel === 'seasonal' && (
            <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#e5e7eb' }}>
              <p className="text-sm" style={{ color: '#000000' }}>
                <strong>Minimální doba pobytu:</strong> {getMinimumStay(room)} {getMinimumStay(room) === 1 ? 'noc' : getMinimumStay(room) < 5 ? 'noci' : 'nocí'}
              </p>
            </div>
          )}
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

        {/* Formulář */}
        <div>
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
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
              />
              {errors.numberOfGuests && (
                <p className="mt-1 text-sm text-red-600">{errors.numberOfGuests}</p>
              )}
            </div>

            {/* Poznámka */}
            <div>
              <label htmlFor="note" className="block mb-2" style={{ fontSize: '14px', fontWeight: 'normal', color: '#000000' }}>
                Poznámka
              </label>
              <textarea
                id="note"
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ fontSize: '14px', fontWeight: 'bold', color: '#000000' }}
              />
            </div>

            {/* Tlačítko odeslat */}
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
          </form>
        </div>
      </div>
    </div>
  );
}

