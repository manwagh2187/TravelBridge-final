import prisma from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

function getAuth(req) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const token = auth.replace('Bearer ', '');
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev');
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const auth = getAuth(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    const { roomId, startDate, endDate } = req.body;

    if (!roomId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing booking fields' });
    }

    const parsedRoomId = Number(roomId);
    if (Number.isNaN(parsedRoomId)) {
      return res.status(400).json({ error: 'Invalid roomId' });
    }

    const s = new Date(startDate);
    const e = new Date(endDate);

    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
      return res.status(400).json({ error: 'Invalid dates' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (s < today) {
      return res.status(400).json({ error: 'Check-in cannot be in the past' });
    }

    if (e <= s) {
      return res.status(400).json({ error: 'Check-out must be after check-in' });
    }

    try {
      const booking = await prisma.$transaction(async (tx) => {
        const room = await tx.room.findUnique({ where: { id: parsedRoomId } });
        if (!room) throw { code: 404, message: 'Room not found' };

        const overlapping = await tx.booking.count({
          where: {
            roomId: parsedRoomId,
            NOT: [
              { endDate: { lte: s } },
              { startDate: { gte: e } }
            ],
            status: { not: 'cancelled' }
          }
        });

        if (overlapping >= room.inventory) {
          throw { code: 409, message: 'No availability for selected dates' };
        }

        const nights = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)));
        const total = nights * room.pricePerNight;

        return tx.booking.create({
          data: {
            userId: auth.userId,
            roomId: parsedRoomId,
            startDate: s,
            endDate: e,
            totalAmount: total,
            status: 'pending',
          }
        });
      });

      res.json(booking);
    } catch (err) {
      if (err?.code) return res.status(err.code).json({ error: err.message });
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  } else if (req.method === 'GET') {
    const auth = getAuth(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    const bookings = await prisma.booking.findMany({
      where: { userId: auth.userId },
      include: { room: { include: { listing: true } } }
    });

    res.json(bookings);
  } else {
    res.status(405).end();
  }
}