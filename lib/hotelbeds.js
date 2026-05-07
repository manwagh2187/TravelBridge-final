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
    throw new Error(
      data?.error?.message ||
      data?.message ||
      data?.error ||
      `Hotelbeds API error (${response.status})`
    );
  }

  return data;
}

export function flattenHotelbedsAvailability(data) {
  const hotels = data?.hotels?.hotels || data?.hotels?.hotel || data?.hotels || [];
  const list = Array.isArray(hotels) ? hotels : [];

  return list.map((hotel) => {
    const rooms = Array.isArray(hotel?.rooms) ? hotel.rooms : [];
    const allRates = rooms.flatMap((room) =>
      Array.isArray(room?.rates)
        ? room.rates.map((rate) => ({
            hotelCode: hotel?.code,
            hotelName: hotel?.name,
            destinationName: hotel?.destinationName,
            zoneName: hotel?.zoneName,
            roomCode: room?.code,
            roomName: room?.name,
            rateKey: rate?.rateKey,
            net: rate?.net,
            boardCode: rate?.boardCode,
            boardName: rate?.boardName,
            cancellationPolicies: rate?.cancellationPolicies || [],
            paymentType: rate?.paymentType,
            packaging: rate?.packaging,
            offers: rate?.offers || [],
            rateType: rate?.rateType,
            rateClass: rate?.rateClass,
            rawRate: rate,
          }))
        : []
    );

    const bestRate =
      allRates.sort((a, b) => Number(a.net) - Number(b.net))[0] || null;

    return {
      hotelCode: hotel?.code,
      name: hotel?.name || 'Unnamed hotel',
      categoryName: hotel?.categoryName || '',
      destinationName: hotel?.destinationName || '',
      zoneName: hotel?.zoneName || '',
      latitude: hotel?.latitude || '',
      longitude: hotel?.longitude || '',
      rooms,
      bestRate,
      allRates,
      raw: hotel,
    };
  });
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
  return hotelbedsRequest(
    `/hotel-api/1.0/bookings/${encodeURIComponent(normalizeReference(reference))}`
  );
}

export async function hbCancelBooking(reference) {
  return hotelbedsRequest(
    `/hotel-api/1.0/bookings/${encodeURIComponent(normalizeReference(reference))}`,
    {
      method: 'DELETE',
    }
  );
}