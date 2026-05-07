import { hbAvailability } from '../../../lib/hotelbeds';

function groupHotelResults(data) {
  const hotelList = Array.isArray(data?.hotels?.hotels)
    ? data.hotels.hotels
    : Array.isArray(data?.hotels?.hotel)
      ? data.hotels.hotel
      : [];

  const grouped = new Map();

  for (const hotel of hotelList) {
    const hotelCode = String(hotel?.code || hotel?.hotelCode || '').trim();
    if (!hotelCode) continue;

    const rooms = Array.isArray(hotel?.rooms) ? hotel.rooms : [];
    const rates = rooms.flatMap((room) =>
      Array.isArray(room?.rates)
        ? room.rates.map((rate) => ({
            hotelCode,
            hotelName: hotel?.name || 'Unnamed hotel',
            destinationName: hotel?.destinationName || hotel?.destination?.name || '',
            zoneName: hotel?.zoneName || '',
            categoryName: hotel?.categoryName || '',
            roomCode: room?.code || '',
            roomName: room?.name || '',
            rateKey: rate?.rateKey || '',
            boardName: rate?.boardName || '',
            paymentType: rate?.paymentType || '',
            net: rate?.net || 0,
            currency: rate?.currency || 'INR',
            rawRate: rate,
          }))
        : []
    );

    if (!grouped.has(hotelCode)) {
      grouped.set(hotelCode, {
        hotelCode,
        id: hotelCode,
        name: hotel?.name || 'Unnamed hotel',
        destinationName: hotel?.destinationName || hotel?.destination?.name || '',
        zoneName: hotel?.zoneName || '',
        categoryName: hotel?.categoryName || '',
        country: hotel?.country?.name || '',
        city: hotel?.destinationName || hotel?.zoneName || '',
        rooms: hotel?.rooms || [],
        rates: [],
        bestRate: null,
        raw: hotel,
      });
    }

    const entry = grouped.get(hotelCode);
    entry.rates.push(...rates);

    const cheapestRate = entry.rates.reduce((best, rate) => {
      if (!best) return rate;
      return Number(rate.net) < Number(best.net) ? rate : best;
    }, null);

    entry.bestRate = cheapestRate;
  }

  return Array.from(grouped.values()).map((hotel) => ({
    ...hotel,
    price: hotel.bestRate?.net || 0,
    currency: hotel.bestRate?.currency || 'INR',
  }));
}

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
    const results = groupHotelResults(data);
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