import { bookFlight } from '../../../src/services/amadeusService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await bookFlight(req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error?.message || 'Booking failed' });
  }
}