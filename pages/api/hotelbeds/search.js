import { hbAvailability, normalizeHotelbedsHotel } from '../../../lib/hotelbeds';

function normalizeLanguage(value) {
  const lang = String(value || 'en').trim().toLowerCase();
  return lang === 'en' ? 'en' : lang;
}

function normalizeCurrency(value) {
  return String(value || 'INR').trim().toUpperCase();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = {
      ...req.body,
      currency: normalizeCurrency(req.body?.currency),
      destination: {
        ...(req.body?.destination || {}),
        code: String(req.body?.destination?.code || '').trim().toUpperCase(),
      },
    };

    const data = await hbAvailability(body);

    const rawHotels =
      data?.hotels?.hotel ||
      data?.hotels ||
      data?.results ||
      [];

    const list = Array.isArray(rawHotels) ? rawHotels : [];
    const results = list.map(normalizeHotelbedsHotel);

    return res.status(200).json({
      results,
      raw: data,
    });
  } catch (error) {
    console.error('Availability API failed:', error);
    return res.status(500).json({ error: error.message });
  }
}