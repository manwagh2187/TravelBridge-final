import { searchFlights } from '../../../src/services/amadeusService';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const result = await searchFlights(req.query || {});
    return res.status(200).json(result);
  } catch (error) {
    const status = error?.response?.status || error?.statusCode || 400;
    const upstream = error?.response?.data;
    const message =
      upstream?.errors?.[0]?.detail ||
      upstream?.error_description ||
      error?.message ||
      'Search failed';

    return res.status(status).json({ error: message });
  }
}