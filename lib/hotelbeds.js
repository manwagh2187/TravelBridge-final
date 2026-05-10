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

function getBaseUrl() {
  const baseUrl = process.env.HOTELBEDS_BASE_URL;
  if (!baseUrl) throw new Error('Missing HOTELBEDS_BASE_URL');
  return baseUrl;
}

async function hotelbedsRequest(path, options = {}) {
  const { apiKey, signature } = buildSignature();

  const response = await fetch(`${getBaseUrl()}${path}`, {
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
    throw new Error(data?.error?.message || data?.message || data?.error || `Hotelbeds API error (${response.status})`);
  }

  return data;
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

export async function hbAvailability(payload) {
  return hotelbedsRequest('/hotel-api/1.0/hotels', {
    method: 'POST',
    body: normalizeAvailabilityPayload(payload),
  });
}

export async function hbHotelContent(hotelCodes) {
  const codes = Array.isArray(hotelCodes)
    ? hotelCodes.filter(Boolean).join(',')
    : String(hotelCodes || '').trim();

  if (!codes) return { hotels: [] };

  return hotelbedsRequest(
    `/hotel-content-api/1.0/hotels/${encodeURIComponent(codes)}/details`,
    { method: 'GET' }
  );
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
  return hotelbedsRequest(`/hotel-api/1.0/bookings/${encodeURIComponent(String(reference || '').trim())}`);
}

export async function hbCancelBooking(reference) {
  return hotelbedsRequest(`/hotel-api/1.0/bookings/${encodeURIComponent(String(reference || '').trim())}`, {
    method: 'DELETE',
  });
}