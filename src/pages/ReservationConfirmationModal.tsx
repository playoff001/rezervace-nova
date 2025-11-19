import { useEffect, useState } from 'react';
import { reservationsAPI } from '../api/api';
import type { Reservation } from '../types';
import { formatDateDisplay } from '../utils/dateUtils';

interface ReservationConfirmationModalProps {
  reservationId: string;
  reservation?: Reservation | null; // PREZENTAČNÍ ÚPRAVA: Přidán optional reservation prop pro zobrazení dat bez opětovného načítání
  onClose: () => void;
}

export default function ReservationConfirmationModal({ reservationId, reservation: initialReservation, onClose }: ReservationConfirmationModalProps) {
  const [reservation, setReservation] = useState<Reservation | null>(initialReservation || null);
  const [loading, setLoading] = useState(!initialReservation);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeDeposit, setQrCodeDeposit] = useState<string | null>(null);
  const [qrCodeFull, setQrCodeFull] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);

  useEffect(() => {
    // PREZENTAČNÍ ÚPRAVA: Načteme rezervaci pouze pokud není předána jako prop
    if (!initialReservation) {
      loadReservation();
    }
  }, [reservationId, initialReservation]);

  useEffect(() => {
    if (reservation) {
      loadQRCodes();
    }
  }, [reservation]);

  async function loadReservation() {
    if (!reservationId) return;
    
    try {
      setLoading(true);
      // PREZENTAČNÍ ÚPRAVA: Timeout 15 sekund pro načtení rezervace
      const response = await Promise.race([
        reservationsAPI.getById(reservationId),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout při načítání rezervace')), 15000)
        )
      ]) as { reservation: Reservation };
      setReservation(response.reservation);
      setError(null);
    } catch (err: any) {
      console.error('Chyba při načítání rezervace:', err);
      // PREZENTAČNÍ ÚPRAVA: I při chybě zobrazíme modal s chybovou hláškou, ale neblokujeme UI
      setError(err.message === 'Timeout při načítání rezervace' 
        ? 'Načítání rezervace trvá déle než obvykle. Zkuste prosím obnovit stránku.'
        : 'Nepodařilo se načíst rezervaci. Rezervace byla ale úspěšně vytvořena.');
    } finally {
      setLoading(false);
    }
  }

  async function loadQRCodes() {
    if (!reservationId || !reservation) return;
    
    try {
      setLoadingQR(true);
      // PREZENTAČNÍ ÚPRAVA: QR kódy načítáme s timeoutem, aby neblokovaly zobrazení modalu
      if (reservation.variableSymbol) {
        if (reservation.depositAmount) {
          try {
            // Timeout 10 sekund pro QR kódy
            const depositQR = await Promise.race([
              reservationsAPI.getQRCode(reservationId, 'deposit'),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
            ]) as { qrCode: string };
            setQrCodeDeposit(depositQR.qrCode);
          } catch (err) {
            console.error('Chyba při načítání QR kódu pro zálohu:', err);
            // Nezobrazíme chybu, QR kód není kritický
          }
        }
        try {
          const fullQR = await Promise.race([
            reservationsAPI.getQRCode(reservationId, 'full'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
          ]) as { qrCode: string };
          setQrCodeFull(fullQR.qrCode);
        } catch (err) {
          console.error('Chyba při načítání QR kódu pro celou částku:', err);
          // Nezobrazíme chybu, QR kód není kritický
        }
      }
    } catch (err) {
      console.error('Chyba při načítání QR kódů:', err);
    } finally {
      setLoadingQR(false);
    }
  }

  async function handleDownloadInvoice() {
    if (!reservationId) return;
    
    try {
      const blob = await reservationsAPI.getInvoice(reservationId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `faktura-${reservation?.invoiceNumber || reservationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Nepodařilo se stáhnout fakturu.');
      console.error(err);
    }
  }

  // PREZENTAČNÍ ÚPRAVA: Modal místo celé stránky, minimalizovaná výška, zmenšené QR kódy
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Křížek pro zavření */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold z-10"
          title="Zavřít"
        >
          ×
        </button>

        {loading && !reservation ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Načítání...</p>
          </div>
        ) : error && !reservation ? (
          <div className="p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h2 className="text-lg font-bold text-yellow-800 mb-2">Rezervace byla vytvořena</h2>
              <p className="text-yellow-700 mb-4">{error}</p>
              <p className="text-sm text-yellow-600">
                ID rezervace: <span className="font-mono">{reservationId.substring(0, 8)}...</span>
              </p>
              <button
                onClick={onClose}
                className="mt-4 w-full text-white text-center py-2 rounded-lg font-medium transition-colors text-sm"
                style={{ backgroundColor: '#a04e27' }}
              >
                Zavřít
              </button>
            </div>
          </div>
        ) : !reservation ? (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h2 className="text-lg font-bold text-red-800 mb-2">Chyba</h2>
              <p className="text-red-700">Rezervace nenalezena.</p>
            </div>
          </div>
        ) : (
          <div className="p-4">
            {/* Hlavička */}
            <div className="text-center mb-4">
              <div className="inline-block bg-green-100 rounded-full p-2 mb-2">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                Rezervace byla úspěšně vytvořena!
              </h1>
              <p className="text-sm text-gray-600">
                Děkujeme za vaši rezervaci.
              </p>
            </div>

            {/* Detaily rezervace - kompaktní */}
            <div className="border-t border-b border-gray-200 py-3 mb-3">
              <h2 className="text-sm font-bold text-gray-900 mb-2">
                Detaily rezervace
              </h2>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-gray-500">ID rezervace</dt>
                  <dd className="font-semibold text-gray-900 text-xs truncate">
                    {reservation.id.substring(0, 8)}...
                  </dd>
                </div>
                {reservation.invoiceNumber && (
                  <div>
                    <dt className="text-gray-500">Číslo faktury</dt>
                    <dd className="font-semibold text-gray-900">
                      {reservation.invoiceNumber}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-500">Pokoj</dt>
                  <dd className="text-gray-900">{reservation.roomName}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Příjezd</dt>
                  <dd className="text-gray-900">{formatDateDisplay(reservation.checkIn)} (PM)</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Odjezd</dt>
                  <dd className="text-gray-900">{formatDateDisplay(reservation.checkOut)} (AM)</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Počet nocí</dt>
                  <dd className="text-gray-900">{reservation.nights}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Celková cena</dt>
                  <dd className="font-bold" style={{ color: '#a04e27' }}>
                    {reservation.totalPrice} Kč
                  </dd>
                </div>
                {reservation.depositAmount && (
                  <div>
                    <dt className="text-gray-500">Záloha</dt>
                    <dd className="text-gray-900">
                      {reservation.depositAmount} Kč
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-500">Jméno</dt>
                  <dd className="text-gray-900 truncate">{reservation.guestName}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Telefon</dt>
                  <dd className="text-gray-900">{reservation.guestPhone}</dd>
                </div>
              </dl>
            </div>

            {/* Platební údaje a QR kódy - kompaktní */}
            {(reservation.variableSymbol || reservation.depositAmount) && (
              <div className="border-t border-b border-gray-200 py-3 mb-3">
                <h2 className="text-sm font-bold text-gray-900 mb-2">
                  Platební údaje
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-900 mb-1">Bankovní převod</h3>
                    <dl className="space-y-1 text-xs">
                      {reservation.variableSymbol && (
                        <div>
                          <dt className="text-gray-500">VS</dt>
                          <dd className="font-semibold text-gray-900">
                            {reservation.variableSymbol}
                          </dd>
                        </div>
                      )}
                      {reservation.depositAmount && (
                        <div>
                          <dt className="text-gray-500">Záloha</dt>
                          <dd className="font-semibold text-gray-900">
                            {reservation.depositAmount} Kč
                          </dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-gray-500">Doplatek</dt>
                        <dd className="font-semibold text-gray-900">
                          {reservation.totalPrice - (reservation.depositAmount || 0)} Kč
                        </dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h3 className="text-xs font-semibold text-gray-900 mb-1">QR kód</h3>
                    {loadingQR ? (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* PREZENTAČNÍ ÚPRAVA: Zmenšené QR kódy */}
                        {qrCodeDeposit && (
                          <div className="text-center">
                            <p className="text-xs text-gray-600 mb-1">Záloha</p>
                            <img src={qrCodeDeposit} alt="QR kód pro zálohu" className="mx-auto border border-gray-300 rounded w-24 h-24" />
                          </div>
                        )}
                        {qrCodeFull && (
                          <div className="text-center">
                            <p className="text-xs text-gray-600 mb-1">Celá částka</p>
                            <img src={qrCodeFull} alt="QR kód pro celou částku" className="mx-auto border border-gray-300 rounded w-24 h-24" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tlačítka */}
            <div className="flex gap-2">
              {reservation.invoiceNumber && (
                <button
                  onClick={handleDownloadInvoice}
                  className="flex-1 bg-gray-600 text-white text-center py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors text-sm"
                >
                  Stáhnout fakturu
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 text-white text-center py-2 rounded-lg font-medium transition-colors text-sm"
                style={{ backgroundColor: '#a04e27' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#8a3f1f';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#a04e27';
                }}
              >
                Zavřít
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

