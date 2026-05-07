import { hbCheckRates } from '../../../lib/hotelbeds';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};

    if (!body.rateKey && !body.hotelCode) {
      return res.status(400).json({ error: 'Missing rateKey or hotelCode' });
    }

    const data = await hbCheckRates(body);

    return res.status(200).json(data);
  } catch (error) {
    console.error('CheckRates API failed:', error);
    return res.status(500).json({ error: error.message });
  }
}