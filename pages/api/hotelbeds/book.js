import { hbCreateBooking } from '../../../lib/hotelbeds';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await hbCreateBooking(req.body);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Book API failed:', error);
    return res.status(500).json({ error: error.message });
  }
}