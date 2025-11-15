import type { Room } from '../types';
import { calculateNights } from './dateUtils';
import { parseISO } from 'date-fns';

/**
 * Zjistí, zda je datum v hlavní sezóně
 * Hlavní sezóna: leden-březen, červenec-srpen, svátky
 */
function isMainSeason(date: Date): boolean {
  const month = date.getMonth() + 1; // 1-12
  // Leden-březen (1-3) nebo červenec-srpen (7-8)
  return (month >= 1 && month <= 3) || (month >= 7 && month <= 8);
}

/**
 * Zjistí, zda je datum v období Vánoc (24.12 - 2.1)
 */
function isChristmas(date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  // 24.12 - 31.12 nebo 1.1 - 2.1
  return (month === 12 && day >= 24) || (month === 1 && day <= 2);
}

/**
 * Zjistí, zda je datum v období Silvestra (28.12 - 3.1)
 */
function isNewYear(date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  // 28.12 - 31.12 nebo 1.1 - 3.1
  return (month === 12 && day >= 28) || (month === 1 && day <= 3);
}

/**
 * Zjistí, zda je datum v období Velikonoc
 * Velikonoce jsou pohyblivý svátek, zjednodušeně: březen-duben
 */
function isEaster(date: Date): boolean {
  const month = date.getMonth() + 1;
  // Zjednodušeně: březen-duben (3-4)
  // V reálné aplikaci by se měl počítat přesný datum Velikonoc
  return month === 3 || month === 4;
}

/**
 * Zjistí, zda je rezervace v období speciálního svátku
 */
function getHolidayPeriod(checkIn: Date, checkOut: Date): string | null {
  // Kontrola Vánoc
  let current = new Date(checkIn);
  while (current <= checkOut) {
    if (isChristmas(current)) return 'christmas';
    current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
  }
  
  // Kontrola Silvestra
  current = new Date(checkIn);
  while (current <= checkOut) {
    if (isNewYear(current)) return 'newyear';
    current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
  }
  
  // Kontrola Velikonoc
  current = new Date(checkIn);
  while (current <= checkOut) {
    if (isEaster(current)) return 'easter';
    current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
  }
  
  return null;
}

/**
 * Vypočítá celkovou cenu rezervace
 */
export function calculateReservationPrice(
  room: Room,
  checkIn: string,
  checkOut: string
): number {
  const nights = calculateNights(checkIn, checkOut);
  
  // Pokud pokoj používá jednoduchý cenový model
  if (!room.pricingModel || room.pricingModel === 'simple') {
    return nights * room.pricePerNight;
  }
  
  // Sezónní cenový model
  if (room.pricingModel === 'seasonal' && room.seasonalPricing) {
    const checkInDate = parseISO(checkIn);
    const checkOutDate = parseISO(checkOut);
    
    // Nejdřív zkontrolujeme speciální svátky
    const holiday = getHolidayPeriod(checkInDate, checkOutDate);
    if (holiday && room.seasonalPricing.holidays) {
      const holidayPricing = room.seasonalPricing.holidays[holiday];
      if (holidayPricing && holidayPricing[nights]) {
        return holidayPricing[nights];
      }
    }
    
    // Pak zkontrolujeme sezónu
    const isMain = isMainSeason(checkInDate);
    const pricing = isMain 
      ? room.seasonalPricing.mainSeason 
      : room.seasonalPricing.offSeason;
    
    // Najdeme cenu pro daný počet nocí
    if (pricing[nights]) {
      return pricing[nights];
    }
    
    // Pokud není přesná cena, použijeme nejbližší nižší nebo vyšší
    const availableNights = Object.keys(pricing).map(Number).sort((a, b) => a - b);
    if (availableNights.length > 0) {
      // Najdeme nejbližší nižší počet nocí
      let closestNights = availableNights[0];
      for (const n of availableNights) {
        if (n <= nights) {
          closestNights = n;
        } else {
          break;
        }
      }
      // Pokud je požadovaný počet nocí vyšší než maximum, použijeme maximum
      const maxNights = Math.max(...availableNights);
      if (nights > maxNights) {
        return pricing[maxNights];
      }
      return pricing[closestNights] || nights * room.pricePerNight;
    }
  }
  
  // Fallback na jednoduchý výpočet
  return nights * room.pricePerNight;
}

/**
 * Získá minimální dobu pobytu pro pokoj
 */
export function getMinimumStay(room: Room): number {
  if (room.pricingModel === 'seasonal' && room.seasonalPricing) {
    // Najdeme minimální počet nocí z hlavní a vedlejší sezóny
    const mainSeasonNights = Object.keys(room.seasonalPricing.mainSeason).map(Number);
    const offSeasonNights = Object.keys(room.seasonalPricing.offSeason).map(Number);
    const allNights = [...mainSeasonNights, ...offSeasonNights];
    
    if (allNights.length > 0) {
      return Math.min(...allNights);
    }
  }
  
  // Pro jednoduchý model je minimální doba 1 noc
  return 1;
}


