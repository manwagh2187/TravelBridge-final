import crypto from 'crypto';

function getSignature() {
  const apiKey = process.env.HOTELBEDS_API_KEY;
  const secret = process.env.HOTELBEDS_SECRET;
  const timestamp = Math.floor(Date.now() / 1000).toString();

  if (!apiKey || !secret) {
    throw new Error('Missing Hotelbeds credentials');
  }

  const signature = crypto
    .createHash('sha256')
    .update(apiKey + secret + timestamp)
    .digest('hex');

  return { apiKey, signature };
}

async function hotelbedsFetch(path, options = {}) {
  const baseUrl = process.env.HOTELBEDS_BASE_URL;
  const { apiKey, signature } = getSignature();

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
    throw new Error(data?.error?.message || data?.message || `Hotelbeds API error (${response.status})`);
  }

  return data;
}

export function normalizeHotelbedsHotel(item) {
  return {
    id: item?.hotel?.code || item?.code || item?.id || '',
    name: item?.hotel?.name || item?.name || '',
    city: item?.destination?.name || item?.city || '',
    country: item?.country?.name || item?.country || '',
    description: item?.description || item?.hotel?.description || '',
    price: item?.minRate?.amount || item?.price?.amount || item?.price || 0,
    currency: item?.minRate?.currency || item?.price?.currency || 'INR',
    raw: item,
  };
}

export async function hbSearchHotels(payload) {
  return hotelbedsFetch('/hotel-api/1.0/hotels', {
    method: 'POST',
    body: payload,
  });
}

export async function hbCheckRates(payload) {
  return hotelbedsFetch('/hotel-api/1.0/checkrates', {
    method: 'POST',
    body: payload,
  });
}

export async function hbCreateBooking(payload) {
  return hotelbedsFetch('/hotel-api/1.0/bookings', {
    method: 'POST',
    body: payload,
  });
}

export async function hbGetBooking(reference) {
  return hotelbedsFetch(`/hotel-api/1.0/bookings/${encodeURIComponent(reference)}`);
}

export async function hbCancelBooking(reference) {
  return hotelbedsFetch(`/hotel-api/1.0/bookings/${encodeURIComponent(reference)}`, {
    method: 'DELETE',
  });
}