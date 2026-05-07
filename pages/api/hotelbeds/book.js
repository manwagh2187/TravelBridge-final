import { hbCreateBooking } from '../../../lib/hotelbeds';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      hotelCode,
      rateKey,
      roomCode,
      boardName,
      holder,
    } = req.body || {};

    if (!hotelCode || !rateKey) {
      return res.status(400).json({ error: 'Missing hotelCode or rateKey' });
    }

    const body = {
      holder: {
        name: holder?.name || '',
        surname: holder?.surname || '',
        email: holder?.email || '',
        phone: holder?.phone || '',
      },
      rooms: [
        {
          rateKey,
          roomCode: roomCode || undefined,
          boardName: boardName || undefined,
          paxes: [
            {
              type: 'AD',
              name: holder?.name || '',
              surname: holder?.surname || '',
            },
          ],
        },
      ],
    };

    const data = await hbCreateBooking(body);

    return res.status(200).json(data);
  } catch (error) {
    console.error('Book API failed:', error);
    return res.status(500).json({ error: error.message });
  }
}