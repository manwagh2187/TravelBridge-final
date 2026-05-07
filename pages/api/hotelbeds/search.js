import { hbAvailability, normalizeHotelbedsHotel } from '../../../lib/hotelbeds';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = {
      ...req.body,
      destination: {
        ...(req.body?.destination || {}),
        code: String(req.body?.destination?.code || '').trim().toUpperCase(),
      },
      currency: String(req.body?.currency || 'INR').trim().toUpperCase(),
    };

    const data = await hbAvailability(body);

    const rawHotels = data?.hotels?.hotel || data?.hotels || data?.results || [];
    const list = Array.isArray(rawHotels) ? rawHotels : [];
    const results = list.map(normalizeHotelbedsHotel);
    const total = data?.hotels?.total ?? results.length;

    return res.status(200).json({
      results,
      raw: data,
      total,
    });
  } catch (error) {
    console.error('Availability API failed:', error);
    return res.status(500).json({ error: error.message });
  }
}