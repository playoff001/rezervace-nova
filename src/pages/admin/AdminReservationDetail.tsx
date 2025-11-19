import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reservationsAPI, adminAPI } from '../../api/api';
import type { Reservation } from '../../types';
import { formatDateDisplay } from '../../utils/dateUtils';

export default function AdminReservationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [sendingSMS, setSendingSMS] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('');

  useEffect(() => {
    if (id) {
      loadReservation();
    }
  }, [id]);

  async function loadReservation() {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await reservationsAPI.getById(id);
      setReservation(response.reservation);
    } catch (error) {
      console.error('Chyba při načítání rezervace:', error);
      alert('Nepodařilo se načíst rezervaci.');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsPaid() {
    if (!id) return;
    
    try {
      setSaving(true);
      await reservationsAPI.markAsPaid(id);
      await loadReservation();
    } catch (error) {
      alert('Nepodařilo se označit rezervaci jako zaplacenou.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    if (!id) return;
    setShowCancelDialog(true);
  }

  async function confirmCancel() {
    if (!id) return;
    
    try {
      setSaving(true);
      await reservationsAPI.cancel(id, refundAmount || undefined, refundReason || undefined);
      await loadReservation();
      setShowCancelDialog(false);
      setRefundAmount(0);
      setRefundReason('');
    } catch (error) {
      alert('Nepodařilo se zrušit rezervaci.');
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkDepositPaid() {
    if (!id) return;
    
    try {
      setSaving(true);
      await reservationsAPI.markDepositPaid(id);
      await loadReservation();
    } catch (error) {
      alert('Nepodařilo se označit zálohu jako zaplacenou.');
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkFinalPaymentPaid() {
    if (!id) return;
    
    try {
      setSaving(true);
      await reservationsAPI.markFinalPaymentPaid(id);
      await loadReservation();
    } catch (error) {
      alert('Nepodařilo se označit doplatek jako zaplacený.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDownloadInvoice() {
    if (!id) return;
    
    try {
      const blob = await reservationsAPI.getInvoice(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `faktura-${reservation?.invoiceNumber || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Nepodařilo se stáhnout fakturu.');
      console.error(err);
    }
  }

  async function handleSendSMS() {
    if (!id || !smsMessage.trim()) return;
    
    try {
      setSendingSMS(true);
      await adminAPI.sendSMS(id, smsMessage);
      setSmsMessage('');
      alert('SMS byla odeslána.');
    } catch (error) {
      alert('Nepodařilo se odeslat SMS.');
    } finally {
      setSendingSMS(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Načítání...</p>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Rezervace nenalezena.</p>
      </div>
    );
  }

  const formatWithPartOfDay = (date: string, type: 'arrival' | 'departure') => {
    const base = formatDateDisplay(date);
    const suffix = type === 'arrival' ? 'odpoledne' : 'dopoledne';
    return `${base} ${suffix}`;
  };

  const getStatusLabel = (status: Reservation['status']) => {
    switch (status) {
      case 'pending':
        return 'Nová rezervace';
      case 'confirmed':
        return 'Potvrzeno';
      case 'paid':
        return 'Zaplaceno';
      case 'cancelled':
      default:
        return 'Zrušeno';
    }
  };

  return (
    <div>
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/rezervace')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Zpět na seznam rezervací
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Detail rezervace</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hlavní informace */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Informace o rezervaci</h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">ID rezervace</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">{reservation.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Příjezd</dt>
                  <dd className="mt-1 text-lg text-gray-900">
                    {formatWithPartOfDay(reservation.checkIn, 'arrival')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Odjezd</dt>
                  <dd className="mt-1 text-lg text-gray-900">
                    {formatWithPartOfDay(reservation.checkOut, 'departure')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Počet nocí</dt>
                  <dd className="mt-1 text-lg text-gray-900">{reservation.nights}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Celková cena</dt>
                  <dd className="mt-1 text-lg font-bold text-blue-600">
                    {reservation.totalPrice} Kč
                  </dd>
                </div>
                {reservation.variableSymbol && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Variabilní symbol</dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900">
                      {reservation.variableSymbol}
                    </dd>
                  </div>
                )}
                {reservation.invoiceNumber && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Číslo faktury</dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900">
                      {reservation.invoiceNumber}
                    </dd>
                  </div>
                )}
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
                {reservation.refundAmount !== undefined && reservation.refundAmount > 0 && (
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-red-500">Vráceno peněz</dt>
                    <dd className="mt-1 text-lg font-semibold text-red-600">
                      {reservation.refundAmount} Kč
                      {reservation.refundReason && (
                        <span className="ml-2 text-sm text-gray-600">({reservation.refundReason})</span>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Informace o hostu</h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Jméno</dt>
                  <dd className="mt-1 text-lg text-gray-900">{reservation.guestName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Počet osob</dt>
                  <dd className="mt-1 text-lg text-gray-900">{reservation.numberOfGuests}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Telefon</dt>
                  <dd className="mt-1 text-lg text-gray-900">
                    <a href={`tel:${reservation.guestPhone}`} className="text-blue-600 hover:text-blue-800">
                      {reservation.guestPhone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">E-mail</dt>
                  <dd className="mt-1 text-lg text-gray-900">
                    <a href={`mailto:${reservation.guestEmail}`} className="text-blue-600 hover:text-blue-800">
                      {reservation.guestEmail}
                    </a>
                  </dd>
                </div>
                {reservation.note && (
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Poznámka</dt>
                    <dd className="mt-1 text-lg text-gray-900">{reservation.note}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Akce */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Stav rezervace</h2>
              <div className="mb-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    reservation.status === 'pending'
                      ? 'bg-blue-100 text-blue-800'
                      : reservation.status === 'confirmed'
                      ? 'bg-blue-100 text-blue-800'
                      : reservation.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {getStatusLabel(reservation.status)}
                </span>
              </div>
              <div className="space-y-2">
                {reservation.depositAmount && (
                  <>
                    {!reservation.depositPaid && (
                      <button
                        onClick={handleMarkDepositPaid}
                        disabled={saving}
                        className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400"
                      >
                        Záloha zaplacena
                      </button>
                    )}
                    {!reservation.finalPaymentPaid && (
                      <button
                        onClick={handleMarkFinalPaymentPaid}
                        disabled={saving}
                        className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400"
                      >
                        Doplatek zaplacen
                      </button>
                    )}
                  </>
                )}
                {!reservation.depositAmount && reservation.status !== 'paid' && (
                  <button
                    onClick={handleMarkAsPaid}
                    disabled={saving}
                    className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400"
                  >
                    Označit jako zaplacené
                  </button>
                )}
                {reservation.invoiceNumber && (
                  <button
                    onClick={handleDownloadInvoice}
                    className="w-full bg-gray-600 text-white py-2 rounded-lg font-medium hover:bg-gray-700"
                  >
                    Stáhnout fakturu (PDF)
                  </button>
                )}
                {reservation.status !== 'cancelled' && (
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400"
                  >
                    Zrušit rezervaci
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Odeslat SMS</h2>
              <div className="space-y-4">
                <textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  placeholder="Zpráva pro hosta..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={handleSendSMS}
                  disabled={sendingSMS || !smsMessage.trim()}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {sendingSMS ? 'Odesílání...' : 'Odeslat SMS'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dialog pro storno s vrácením peněz */}
        {showCancelDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Zrušit rezervaci</h2>
              <p className="text-gray-700 mb-4">
                Opravdu chcete zrušit tuto rezervaci?
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vrácená částka (Kč)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={reservation.totalPrice}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Důvod vrácení peněz (volitelné)
                  </label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Např. Storno z důvodu nemoci..."
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowCancelDialog(false);
                    setRefundAmount(0);
                    setRefundReason('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400"
                >
                  Zrušit
                </button>
                <button
                  onClick={confirmCancel}
                  disabled={saving}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400"
                >
                  {saving ? 'Ruším...' : 'Potvrdit storno'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

