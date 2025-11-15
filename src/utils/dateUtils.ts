import { format, parseISO, addDays, isBefore, isAfter, isSameDay, startOfDay } from 'date-fns';
import { cs } from 'date-fns/locale/cs';
import type { HalfDay } from '../types';

/**
 * Formátuje datum do ISO formátu (YYYY-MM-DD)
 */
export function formatDateISO(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
}

/**
 * Formátuje datum pro zobrazení
 */
export function formatDateDisplay(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'd. M. yyyy', { locale: cs });
}

/**
 * Zkontroluje, zda je datum v minulosti
 */
export function isPastDate(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const today = startOfDay(new Date());
  return isBefore(d, today);
}

/**
 * Vypočítá počet nocí mezi dvěma daty
 */
export function calculateNights(checkIn: string, checkOut: string): number {
  const checkInDate = parseISO(checkIn);
  const checkOutDate = parseISO(checkOut);
  
  if (isBefore(checkOutDate, checkInDate) || isSameDay(checkInDate, checkOutDate)) {
    return 0;
  }
  
  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Vytvoří pole všech dat mezi checkIn a checkOut (včetně)
 */
export function getDatesBetween(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  let currentDate = parseISO(checkIn);
  const endDate = parseISO(checkOut);
  
  while (!isAfter(currentDate, endDate)) {
    dates.push(formatDateISO(currentDate));
    currentDate = addDays(currentDate, 1);
  }
  
  return dates;
}

/**
 * Získá všechny půlky dne pro rezervaci
 * Příjezd = PM, odjezd = AM, dny mezi = AM+PM
 */
export function getHalfDaysForReservation(
  checkIn: string,
  checkOut: string
): Array<{ date: string; halfDay: HalfDay }> {
  const dates = getDatesBetween(checkIn, checkOut);
  const halfDays: Array<{ date: string; halfDay: HalfDay }> = [];
  
  dates.forEach((date, index) => {
    if (index === 0) {
      // První den = příjezd = PM
      halfDays.push({ date, halfDay: 'PM' });
    } else if (index === dates.length - 1) {
      // Poslední den = odjezd = AM
      halfDays.push({ date, halfDay: 'AM' });
    } else {
      // Dny mezi = AM + PM
      halfDays.push({ date, halfDay: 'AM' });
      halfDays.push({ date, halfDay: 'PM' });
    }
  });
  
  return halfDays;
}

/**
 * Vytvoří pole dat pro kalendář (např. měsíc dopředu a dozadu)
 */
export function getCalendarDates(centerDate: Date = new Date(), monthsBefore: number = 1, monthsAfter: number = 12): string[] {
  const dates: string[] = [];
  const start = addDays(centerDate, -30 * monthsBefore);
  const end = addDays(centerDate, 30 * monthsAfter);
  
  let current = startOfDay(start);
  const endDay = startOfDay(end);
  
  while (!isAfter(current, endDay)) {
    dates.push(formatDateISO(current));
    current = addDays(current, 1);
  }
  
  return dates;
}

/**
 * Zkontroluje, zda se dva rozsahy dat překrývají
 */
export function datesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = parseISO(start1);
  const e1 = parseISO(end1);
  const s2 = parseISO(start2);
  const e2 = parseISO(end2);
  
  return (isBefore(s1, e2) || isSameDay(s1, e2)) && 
         (isAfter(e1, s2) || isSameDay(e1, s2));
}

