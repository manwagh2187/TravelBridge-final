const TBO_BASE_URL = process.env.TBO_BASE_URL;
const TBO_CLIENT_ID = process.env.TBO_CLIENT_ID;
const TBO_CLIENT_SECRET = process.env.TBO_CLIENT_SECRET;

let cachedToken = null;
let tokenExpiresAt = 0;

function assertTboConfig() {
  const missing = [];
  if (!TBO_BASE_URL) missing.push('TBO_BASE_URL');
  if (!TBO_CLIENT_ID) missing.push('TBO_CLIENT_ID');
  if (!TBO_CLIENT_SECRET) missing.push('TBO_CLIENT_SECRET');

  if (missing.length) {
    throw new Error(`Missing TBO configuration: ${missing.join(', ')}`);
  }
}

async function readErrorResponse(res) {
  const contentType = res.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      return await res.json();
    }

    const text = await res.text();
    return text ? { message: text } : {};
  } catch {
    return {};
  }
}

async function authenticate() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  assertTboConfig();

  const res = await fetch(`${TBO_BASE_URL}/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      clientId: TBO_CLIENT_ID,
      clientSecret: TBO_CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    const err = await readErrorResponse(res);
    throw new Error(
      err.message ||
        `TBO authentication failed (${res.status} ${res.statusText})`
    );
  }

  const data = await readErrorResponse(res);

  if (!data.accessToken) {
    throw new Error('TBO authentication succeeded but no access token was returned');
  }

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
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await readErrorResponse(res);

  if (!res.ok) {
    throw new Error(data.message || `TBO request failed (${res.status} ${res.statusText})`);
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