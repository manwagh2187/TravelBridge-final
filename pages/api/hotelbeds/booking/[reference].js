import { hbGetBooking } from '../../../../lib/hotelbeds';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reference } = req.query;
    const data = await hbGetBooking(reference);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Booking details API failed:', error);
    return res.status(500).json({ error: error.message });
  }
}