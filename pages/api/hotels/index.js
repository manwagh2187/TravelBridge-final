import { searchIndiaHotels } from '../../../lib/hotel-service';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const result = await searchIndiaHotels(req.query);
    res.status(200).json(result.hotels);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load hotels' });
  }
}