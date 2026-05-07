import crypto from 'crypto';

function buildSignature() {
  const apiKey = process.env.HOTELBEDS_API_KEY;
  const secret = process.env.HOTELBEDS_SECRET;
  const timestamp = Math.floor(Date.now() / 1000).toString();

  if (!apiKey) throw new Error('Missing HOTELBEDS_API_KEY');
  if (!secret) throw new Error('Missing HOTELBEDS_SECRET');

  const signature = crypto
    .createHash('sha256')
    .update(apiKey + secret + timestamp)
    .digest('hex');

  return { apiKey, signature };
}

function normalizeAvailabilityPayload(payload = {}) {
  return {
    ...payload,
    currency: String(payload?.currency || 'INR').trim().toUpperCase(),
    destination: {
      ...(payload?.destination || {}),
      code: String(payload?.destination?.code || '').trim().toUpperCase(),
    },
  };
}

function normalizeReference(value) {
  return String(value || '').trim();
}

function getFriendlyHotelbedsError(status, data, rawText) {
  const message =
    data?.error?.message ||
    data?.message ||
    data?.error ||
    rawText ||
    `Hotelbeds API error (${status})`;

  if (String(message).toLowerCase().includes('quota exceeded')) {
    return 'Hotelbeds quota exceeded. Please try again later or contact support.';
  }

  return message;
}

async function hotelbedsRequest(path, options = {}) {
  const baseUrl = process.env.HOTELBEDS_BASE_URL;
  if (!baseUrl) throw new Error('Missing HOTELBEDS_BASE_URL');

  const { apiKey, signature } = buildSignature();

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Api-key': apiKey,
      'X-Signature': signature,
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();

  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    console.error('Hotelbeds request failed:', response.status, text);
    throw new Error(getFriendlyHotelbedsError(response.status, data, text));
  }

  console.log('Hotelbeds success response:', text);
  return data;
}

export function normalizeHotelbedsHotel(item) {
  return {
    id: item?.hotel?.code || item?.code || item?.hotelCode || '',
    name: item?.hotel?.name || item?.name || 'Unnamed hotel',
    city: item?.destination?.name || item?.city || '',
    country: item?.country?.name || item?.country || '',
    description: item?.description || item?.hotel?.description || '',
    price: item?.minRate?.amount || item?.price?.amount || item?.price || 0,
    currency: item?.minRate?.currency || item?.price?.currency || 'INR',
    raw: item,
  };
}

export async function hbAvailability(payload) {
  const normalizedPayload = normalizeAvailabilityPayload(payload);
  console.log('Hotelbeds availability payload:', normalizedPayload);

  return hotelbedsRequest('/hotel-api/1.0/hotels', {
    method: 'POST',
    body: normalizedPayload,
  });
}

export async function hbCheckRates(payload) {
  return hotelbedsRequest('/hotel-api/1.0/checkrates', {
    method: 'POST',
    body: payload,
  });
}

export async function hbCreateBooking(payload) {
  return hotelbedsRequest('/hotel-api/1.0/bookings', {
    method: 'POST',
    body: payload,
  });
}

export async function hbGetBooking(reference) {
  return hotelbedsRequest(`/hotel-api/1.0/bookings/${encodeURIComponent(normalizeReference(reference))}`);
}

export async function hbCancelBooking(reference) {
  return hotelbedsRequest(`/hotel-api/1.0/bookings/${encodeURIComponent(normalizeReference(reference))}`, {
    method: 'DELETE',
  });
}