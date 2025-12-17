// Typy pro půlky dne
export type HalfDay = 'AM' | 'PM';

// Stav rezervace
export type ReservationStatus = 
  | 'pending'      // čeká na potvrzení
  | 'confirmed'    // potvrzeno
  | 'paid'         // zaplaceno
  | 'cancelled';   // zrušeno

// Metoda platby
export type PaymentMethod = 
  | 'transfer'     // převod
  | 'qr'           // QR kód
  | 'cash';        // hotově

// Blokace půlky dne
export interface Block {
  id: string;
  roomId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  halfDay: HalfDay; // 'AM' nebo 'PM'
  reason?: string; // důvod blokace (údržba, sanitace, atd.)
  createdAt: string;
}

// Typ rezervace (penzion vs. pokoje)
export type BookingType = 'guesthouse' | 'room';

// Vybrané služby pro pokojovou variantu
export interface SelectedServicesData {
  breakfast?: { selected: boolean; pricePerPersonPerNight: number; totalPrice: number };
  halfBoard?: { selected: boolean; pricePerPersonPerNight: number; totalPrice: number };
  fullBoard?: { selected: boolean; pricePerPersonPerNight: number; totalPrice: number };
  customService?: { selected: boolean; label: string; pricePerPersonPerNight: number; totalPrice: number };
}

// Rezervace
export interface Reservation {
  id: string;
  roomId: string;
  roomName: string;
  checkIn: string; // ISO date string (YYYY-MM-DD) - příjezd = PM
  checkOut: string; // ISO date string (YYYY-MM-DD) - odjezd = AM
  nights: number; // počet nocí
  totalPrice: number; // celková cena
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  numberOfGuests: number;
  note?: string;
  status: ReservationStatus;
  paymentMethod?: PaymentMethod;
  paymentNote?: string;
  // Typ rezervace a ceník
  bookingType?: BookingType; // 'guesthouse' = penzion (záloha+doplatek), 'room' = pokoj (celá částka)
  basePricePerPersonPerNight?: number; // základní cena za osobu/noc (pro pokoje)
  basePrice?: number; // základní cena bez služeb (pro pokoje)
  selectedServices?: SelectedServicesData; // vybrané služby (pro pokoje)
  // Platební údaje
  variableSymbol?: string; // variabilní symbol (rok + pořadové číslo)
  invoiceNumber?: string; // číslo faktury (rok + pořadové číslo)
  depositAmount?: number; // výše zálohy (50% z totalPrice) - pouze pro penzion
  depositPaid?: boolean; // zda je záloha zaplacena
  finalPaymentPaid?: boolean; // zda je doplatek zaplacen
  refundAmount?: number; // částka vrácená při stornu
  refundReason?: string; // důvod vrácení peněz
  createdAt: string;
  updatedAt: string;
}

// Typ cenového modelu
export type PricingModel = 'simple' | 'seasonal'; // jednoduchý (cena za noc) nebo sezónní (tabulka cen)

// Sezónní ceny podle počtu nocí
export interface SeasonalPricing {
  mainSeason: { [nights: number]: number }; // hlavní sezóna: počet nocí -> cena
  offSeason: { [nights: number]: number }; // vedlejší sezóna: počet nocí -> cena
  holidays?: { [holidayName: string]: { [nights: number]: number } }; // speciální svátky
}

// Pokoj
export interface Room {
  id: string;
  name: string;
  capacity: number; // maximální počet osob v pokoji
  /**
   * Základní cena:
   * - u penzionové varianty slouží jako fallback / jednoduchý model,
   * - u pokoje znamená "cena za osobu / den".
   */
  pricePerNight: number;
  pricingModel?: PricingModel; // typ cenového modelu
  seasonalPricing?: SeasonalPricing; // sezónní ceny (pokud pricingModel === 'seasonal')
  description?: string;
  available: boolean; // zda je pokoj dostupný pro rezervace
  /**
   * Volitelné příplatkové služby pro pokojovou variantu (Kč / osoba / den).
   * Pokud je cena prázdná nebo 0, služba se ve formuláři vůbec nezobrazí.
   */
  extraServices?: {
    breakfastPrice?: number;      // snídaně
    halfBoardPrice?: number;     // polopenze
    fullBoardPrice?: number;     // plná penze
    customLabel?: string;        // vlastní název služby (např. "soukromé parkování")
    customServicePrice?: number; // cena vlastní služby
  };
  createdAt: string;
  updatedAt: string;
}

// Administrátor
export interface Admin {
  id: string;
  username: string;
  passwordHash: string; // hash hesla
  email: string; // e-mail pro notifikace
  smsGateway?: string; // SMS brána (API klíč)
  createdAt: string;
}

// Konfigurace e-mailu
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

// Konfigurace SMS
export interface SMSConfig {
  apiKey: string;
  apiUrl: string;
  sender: string;
}

// Nastavení penzionu
export interface GuesthouseSettings {
  name: string; // název penzionu
  ico: string; // IČO
  dic: string; // DIČ
  address: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  bankAccount: {
    accountNumber: string; // číslo účtu (IBAN nebo formát CZ)
    bankCode?: string; // kód banky (pokud není v IBAN)
  };
}

// Data pro vytvoření rezervace
export interface CreateReservationData {
  roomId: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  numberOfGuests: number;
  note?: string;
}

// Data pro vytvoření blokace
export interface CreateBlockData {
  roomId: string;
  date: string;
  halfDay: HalfDay;
  reason?: string;
}

// Stav kalendáře pro konkrétní den
export interface DayStatus {
  date: string; // ISO date string (YYYY-MM-DD)
  am: 'available' | 'reserved' | 'blocked' | 'past';
  pm: 'available' | 'reserved' | 'blocked' | 'past';
}

// Validace rezervace
export interface ReservationValidation {
  valid: boolean;
  errors: string[];
}


