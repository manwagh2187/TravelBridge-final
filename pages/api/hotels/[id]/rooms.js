import prisma from '../../../../lib/prisma';
import { loadHotelRooms } from '../../../../lib/hotel-service';

function mapRoom(room) {
  return {
    id: room.id,
    supplierRoomId: room.supplierRoomId || room.id,
    title: room.title || room.name || 'Room',
    capacity: room.capacity || 2,
    inventory: room.inventory ?? room.available ?? 0,
    pricePerNight: room.pricePerNight ?? room.price ?? 0,
  };
}

async function loadLocalRooms(id) {
  const listing = await prisma.listing.findUnique({
    where: { id: String(id) },
    include: { rooms: true },
  });

  if (!listing || !Array.isArray(listing.rooms)) return [];

  return listing.rooms.map(mapRoom);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const rooms = await loadHotelRooms(req.query.id, req.query);
    return res.status(200).json(rooms);
  } catch (err) {
    try {
      const rooms = await loadLocalRooms(req.query.id);
      return res.status(200).json(rooms);
    } catch (fallbackErr) {
      return res.status(500).json({
        error: err.message || fallbackErr.message || 'Failed to load rooms',
      });
    }
  }
}