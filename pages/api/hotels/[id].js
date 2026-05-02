import { loadHotelDetails } from '../../../lib/hotel-service';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const hotel = await loadHotelDetails(req.query.id);
    res.status(200).json(hotel);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load hotel' });
  }
}