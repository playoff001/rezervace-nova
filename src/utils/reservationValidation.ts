import type { Reservation, Block, Room, ReservationValidation, CreateReservationData } from '../types';
import { getHalfDaysForReservation, isPastDate, calculateNights } from './dateUtils';
import { getMinimumStay } from './priceCalculation';
import { parseISO, isBefore } from 'date-fns';

/**
 * Validuje rezervaci před vytvořením
 */
export function validateReservation(
  data: CreateReservationData,
  room: Room,
  existingReservations: Reservation[],
  existingBlocks: Block[]
): ReservationValidation {
  const errors: string[] = [];

  // Validace pokoje
  if (!room.available) {
    errors.push('Tento pokoj není momentálně dostupný pro rezervace.');
  }

  if (data.numberOfGuests > room.capacity) {
    errors.push(`Počet osob (${data.numberOfGuests}) překračuje kapacitu pokoje (${room.capacity}).`);
  }

  // Validace dat
  if (isPastDate(data.checkIn)) {
    errors.push('Datum příjezdu nemůže být v minulosti.');
  }

  if (isPastDate(data.checkOut)) {
    errors.push('Datum odjezdu nemůže být v minulosti.');
  }

  const checkInDate = parseISO(data.checkIn);
  const checkOutDate = parseISO(data.checkOut);

  if (isBefore(checkOutDate, checkInDate) || checkInDate.getTime() === checkOutDate.getTime()) {
    errors.push('Datum odjezdu musí být po datu příjezdu.');
  }

  const nights = calculateNights(data.checkIn, data.checkOut);
  if (nights === 0) {
    errors.push('Minimální délka pobytu je 1 noc.');
  }

  // Validace minimální doby pobytu pro sezónní pokoje
  const minimumStay = getMinimumStay(room);
  if (nights < minimumStay) {
    errors.push(`Minimální doba pobytu je ${minimumStay} ${minimumStay === 1 ? 'noc' : minimumStay < 5 ? 'noci' : 'nocí'}.`);
  }

  // Validace kolizí s existujícími rezervacemi
  const requestedHalfDays = getHalfDaysForReservation(data.checkIn, data.checkOut);
  
  for (const { date, halfDay } of requestedHalfDays) {
    // Kontrola kolizí s rezervacemi
    const conflictingReservation = existingReservations.find(res => {
      if (res.roomId !== data.roomId || res.status === 'cancelled') {
        return false;
      }
      
      const resHalfDays = getHalfDaysForReservation(res.checkIn, res.checkOut);
      return resHalfDays.some(hd => hd.date === date && hd.halfDay === halfDay);
    });

    if (conflictingReservation) {
      errors.push(`Termín koliduje s existující rezervací (${conflictingReservation.id}).`);
      break;
    }

    // Kontrola kolizí s blokacemi
    const conflictingBlock = existingBlocks.find(block => 
      block.roomId === data.roomId && 
      block.date === date && 
      block.halfDay === halfDay
    );

    if (conflictingBlock) {
      errors.push(`Termín koliduje s blokací pokoje (${conflictingBlock.reason || 'blokováno'}).`);
      break;
    }
  }

  // Validace kontaktních údajů
  if (!data.guestName || data.guestName.trim().length < 2) {
    errors.push('Jméno musí obsahovat alespoň 2 znaky.');
  }

  if (!data.guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.guestEmail)) {
    errors.push('Zadejte platnou e-mailovou adresu.');
  }

  if (!data.guestPhone || !/^[\d\s\+\-\(\)]+$/.test(data.guestPhone) || data.guestPhone.replace(/\D/g, '').length < 9) {
    errors.push('Zadejte platné telefonní číslo.');
  }

  if (data.numberOfGuests < 1) {
    errors.push('Počet osob musí být alespoň 1.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Zkontroluje, zda je konkrétní půlka dne dostupná
 */
export function isHalfDayAvailable(
  roomId: string,
  date: string,
  halfDay: 'AM' | 'PM',
  reservations: Reservation[],
  blocks: Block[]
): boolean {
  // Kontrola blokací
  const block = blocks.find(b => 
    b.roomId === roomId && 
    b.date === date && 
    b.halfDay === halfDay
  );
  
  if (block) {
    return false;
  }

  // Kontrola rezervací
  const conflictingReservation = reservations.find(res => {
    if (res.roomId !== roomId || res.status === 'cancelled') {
      return false;
    }
    
    const resHalfDays = getHalfDaysForReservation(res.checkIn, res.checkOut);
    return resHalfDays.some(hd => hd.date === date && hd.halfDay === halfDay);
  });

  return !conflictingReservation;
}

