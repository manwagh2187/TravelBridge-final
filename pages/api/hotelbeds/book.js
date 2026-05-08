import { hbCreateBooking } from '../../../lib/hotelbeds';

function buildClientReference() {
  const ts = String(Date.now()).slice(-8);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TB${ts}${rand}`.slice(0, 20);
}

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
      guests = 1,
      checkIn,
      checkOut,
      destinationName,
    } = req.body || {};

    if (!hotelCode || !rateKey) {
      return res.status(400).json({ error: 'Missing hotelCode or rateKey' });
    }

    const clientReference = buildClientReference();

    const body = {
      clientReference,
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
              roomId: 1,
              type: 'AD',
              name: holder?.name || '',
              surname: holder?.surname || '',
            },
          ],
        },
      ],
      checkIn,
      checkOut,
      destinationName,
      guests,
    };

    const data = await hbCreateBooking(body);

    return res.status(200).json({
      ...data,
      clientReference,
    });
  } catch (error) {
    console.error('Book API failed:', error);
    return res.status(500).json({ error: error.message });
  }
}