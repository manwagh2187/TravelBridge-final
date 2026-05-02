const TBO_BASE_URL = process.env.TBO_BASE_URL;
const TBO_CLIENT_ID = process.env.TBO_CLIENT_ID;
const TBO_CLIENT_SECRET = process.env.TBO_CLIENT_SECRET;

let cachedToken = null;
let tokenExpiresAt = 0;

async function authenticate() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const res = await fetch(`${TBO_BASE_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: TBO_CLIENT_ID,
      clientSecret: TBO_CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'TBO authentication failed');
  }

  const data = await res.json();
  cachedToken = data.accessToken;
  tokenExpiresAt = Date.now() + ((data.expiresIn || 3600) - 60) * 1000;
  return cachedToken;
}

async function request(path, options = {}) {
  const token = await authenticate();

  const res = await fetch(`${TBO_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'TBO request failed');
  }

  return data;
}

export async function searchHotels(params) {
  return request('/hotels/search', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getHotelDetails(hotelId) {
  return request(`/hotels/${hotelId}`);
}

export async function getRoomAvailability(hotelId, params) {
  return request(`/hotels/${hotelId}/rooms`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function createBooking(payload) {
  return request('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function cancelBooking(bookingId) {
  return request(`/bookings/${bookingId}/cancel`, {
    method: 'POST',
  });
}