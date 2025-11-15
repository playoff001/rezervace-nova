import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reservationsAPI } from '../api/api';
import type { Reservation } from '../types';
import { formatDateDisplay } from '../utils/dateUtils';

export default function ReservationConfirmation() {
  const { reservationId } = useParams<{ reservationId: string }>();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeDeposit, setQrCodeDeposit] = useState<string | null>(null);
  const [qrCodeFull, setQrCodeFull] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);

  useEffect(() => {
    if (reservationId) {
      loadReservation();
    }
  }, [reservationId]);

  useEffect(() => {
    if (reservation) {
      loadQRCodes();
    }
  }, [reservation]);

  async function loadReservation() {
    if (!reservationId) return;
    
    try {
      setLoading(true);
      const response = await reservationsAPI.getById(reservationId);
      setReservation(response.reservation);
      setError(null);
    } catch (err: any) {
      setError('Nepodařilo se načíst rezervaci.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadQRCodes() {
    if (!reservationId || !reservation) return;
    
    try {
      setLoadingQR(true);
      // Zkusíme načíst QR kódy pouze pokud má rezervace variabilní symbol
      if (reservation.variableSymbol) {
        if (reservation.depositAmount) {
          try {
            const depositQR = await reservationsAPI.getQRCode(reservationId, 'deposit');
            setQrCodeDeposit(depositQR.qrCode);
          } catch (err) {
            console.error('Chyba při načítání QR kódu pro zálohu:', err);
          }
        }
        try {
          const fullQR = await reservationsAPI.getQRCode(reservationId, 'full');
          setQrCodeFull(fullQR.qrCode);
        } catch (err) {
          console.error('Chyba při načítání QR kódu pro celou částku:', err);
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

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Načítání...</p>
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">Chyba</h2>
          <p className="text-red-700">{error || 'Rezervace nenalezena.'}</p>
          <Link
            to="/"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            ← Zpět na výběr pokoje
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <div className="inline-block bg-green-100 rounded-full p-4 mb-4">
            <svg
              className="w-16 h-16 text-green-600"
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Rezervace byla úspěšně vytvořena!
          </h1>
          <p className="text-gray-600">
            Děkujeme za vaši rezervaci. Potvrzovací e-mail a SMS byly odeslány.
          </p>
        </div>

        <div className="border-t border-b border-gray-200 py-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Detaily rezervace
          </h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">ID rezervace</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {reservation.id}
              </dd>
            </div>
            {reservation.invoiceNumber && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Číslo faktury</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">
                  {reservation.invoiceNumber}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Pokoj</dt>
              <dd className="mt-1 text-lg text-gray-900">
                {reservation.roomName}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Příjezd</dt>
              <dd className="mt-1 text-lg text-gray-900">
                {formatDateDisplay(reservation.checkIn)} (PM)
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Odjezd</dt>
              <dd className="mt-1 text-lg text-gray-900">
                {formatDateDisplay(reservation.checkOut)} (AM)
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Počet nocí</dt>
              <dd className="mt-1 text-lg text-gray-900">
                {reservation.nights}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Celková cena</dt>
              <dd className="mt-1 text-lg font-bold" style={{ color: '#a04e27' }}>
                {reservation.totalPrice} Kč
              </dd>
            </div>
            {reservation.depositAmount && (
              <>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Záloha (50%)</dt>
                  <dd className="mt-1 text-lg text-gray-900">
                    {reservation.depositAmount} Kč
                    {reservation.depositPaid && (
                      <span className="ml-2 text-green-600 font-semibold">✓ Zaplaceno</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Doplatek (50%)</dt>
                  <dd className="mt-1 text-lg text-gray-900">
                    {reservation.totalPrice - reservation.depositAmount} Kč
                    {reservation.finalPaymentPaid && (
                      <span className="ml-2 text-green-600 font-semibold">✓ Zaplaceno</span>
                    )}
                  </dd>
                </div>
              </>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Jméno hosta</dt>
              <dd className="mt-1 text-lg text-gray-900">
                {reservation.guestName}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Telefon</dt>
              <dd className="mt-1 text-lg text-gray-900">
                {reservation.guestPhone}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">E-mail</dt>
              <dd className="mt-1 text-lg text-gray-900">
                {reservation.guestEmail}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Počet osob</dt>
              <dd className="mt-1 text-lg text-gray-900">
                {reservation.numberOfGuests}
              </dd>
            </div>
            {reservation.note && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Poznámka</dt>
                <dd className="mt-1 text-lg text-gray-900">
                  {reservation.note}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Stav</dt>
              <dd className="mt-1">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    reservation.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : reservation.status === 'confirmed'
                      ? 'bg-blue-100 text-blue-800'
                      : reservation.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {reservation.status === 'pending'
                    ? 'Čeká na potvrzení'
                    : reservation.status === 'confirmed'
                    ? 'Potvrzeno'
                    : reservation.status === 'paid'
                    ? 'Zaplaceno'
                    : 'Zrušeno'}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Platební údaje */}
        {(reservation.variableSymbol || reservation.depositAmount) && (
          <div className="border-t border-b border-gray-200 py-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Platební údaje
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Bankovní převod</h3>
                <dl className="space-y-2">
                  {reservation.variableSymbol && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Variabilní symbol</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900">
                        {reservation.variableSymbol}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Číslo účtu</dt>
                    <dd className="mt-1 text-sm text-gray-600">
                      (bude zobrazeno v e-mailu)
                    </dd>
                  </div>
                  {reservation.depositAmount && (
                    <>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Záloha k úhradě</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">
                          {reservation.depositAmount} Kč
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Doplatek k úhradě</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">
                          {reservation.totalPrice - reservation.depositAmount} Kč
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">QR kód pro platbu</h3>
                {loadingQR ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-sm text-gray-600">Načítání QR kódu...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {qrCodeDeposit && (
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700 mb-2">QR kód pro zálohu</p>
                        <img src={qrCodeDeposit} alt="QR kód pro zálohu" className="mx-auto border border-gray-300 rounded" />
                      </div>
                    )}
                    {qrCodeFull && (
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700 mb-2">QR kód pro celou částku</p>
                        <img src={qrCodeFull} alt="QR kód pro celou částku" className="mx-auto border border-gray-300 rounded" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          {reservation.invoiceNumber && (
            <button
              onClick={handleDownloadInvoice}
              className="flex-1 bg-gray-600 text-white text-center py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Stáhnout fakturu (PDF)
            </button>
          )}
          <Link
            to="/"
            className="flex-1 bg-blue-600 text-white text-center py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            style={{ backgroundColor: '#a04e27' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#8a3f1f';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#a04e27';
            }}
          >
            Vytvořit novou rezervaci
          </Link>
        </div>
      </div>
    </div>
  );
}
