// API URL - v produkci použij environment variable, jinak použij proxy (dev) nebo relativní cestu
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Základní fetch wrapper s error handling
 */
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Chyba serveru' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// API pro pokoje
export const roomsAPI = {
  getAll: () => fetchAPI<{ rooms: any[] }>('/rooms'),
  getById: (id: string) => fetchAPI<{ room: any }>(`/rooms/${id}`),
  create: (data: any) => fetchAPI<{ room: any }>('/rooms', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI<{ room: any }>(`/rooms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI<{ success: boolean }>(`/rooms/${id}`, {
    method: 'DELETE',
  }),
};

// API pro rezervace
export const reservationsAPI = {
  getAll: () => fetchAPI<{ reservations: any[] }>('/reservations'),
  getById: (id: string) => fetchAPI<{ reservation: any }>(`/reservations/${id}`),
  create: (data: any) => fetchAPI<{ reservation: any }>('/reservations', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI<{ reservation: any }>(`/reservations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  cancel: (id: string, refundAmount?: number, refundReason?: string) => fetchAPI<{ reservation: any }>(`/reservations/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ refundAmount, refundReason }),
  }),
  markAsPaid: (id: string) => fetchAPI<{ reservation: any }>(`/reservations/${id}/paid`, {
    method: 'POST',
  }),
  markDepositPaid: (id: string) => fetchAPI<{ reservation: any }>(`/reservations/${id}/deposit-paid`, {
    method: 'POST',
  }),
  markFinalPaymentPaid: (id: string) => fetchAPI<{ reservation: any }>(`/reservations/${id}/final-payment-paid`, {
    method: 'POST',
  }),
  getQRCode: (id: string, type?: 'deposit' | 'full') => {
    const url = type ? `/reservations/${id}/qrcode?type=${type}` : `/reservations/${id}/qrcode`;
    return fetchAPI<{ qrCode: string }>(url);
  },
      getInvoice: (id: string) => {
        return fetch(`${API_BASE_URL}/reservations/${id}/invoice`, {
          method: 'GET',
        }).then(async response => {
          if (!response.ok) {
            // Pokud je to JSON chyba, zkusíme přečíst chybovou zprávu
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Nepodařilo se stáhnout fakturu');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.blob();
        });
      },
};

// API pro blokace
export const blocksAPI = {
  getAll: (roomId?: string) => {
    const url = roomId ? `/blocks?roomId=${roomId}` : '/blocks';
    return fetchAPI<{ blocks: any[] }>(url);
  },
  create: (data: any) => fetchAPI<{ block: any }>('/blocks', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI<{ success: boolean }>(`/blocks/${id}`, {
    method: 'DELETE',
  }),
};

// API pro kalendář
export const calendarAPI = {
  getRoomCalendar: (roomId: string, startDate?: string, endDate?: string) => {
    let url = `/calendar/${roomId}`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return fetchAPI<{ reservations: any[]; blocks: any[] }>(url);
  },
};

// API pro administraci
export const adminAPI = {
  login: (username: string, password: string) => 
    fetchAPI<{ token: string; admin: any }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  getConfig: () => fetchAPI<{ config: any }>('/admin/config'),
  updateConfig: (config: any) => fetchAPI<{ config: any }>('/admin/config', {
    method: 'PUT',
    body: JSON.stringify(config),
  }),
  sendSMS: (reservationId: string, message: string) =>
    fetchAPI<{ success: boolean }>(`/admin/sms/${reservationId}`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
};


