import prisma from '../../../lib/prisma';
import { loadHotelDetails } from '../../../lib/hotel-service';

function mapListingToHotel(listing) {
  if (!listing) return null;

  return {
    id: listing.id,
    title: listing.title || listing.name || 'Hotel',
    description: listing.description || '',
    city: listing.city || '',
    country: listing.country || 'India',
    state: listing.state || '',
    address: listing.address || '',
    latitude: listing.latitude ?? null,
    longitude: listing.longitude ?? null,
    starRating: listing.starRating ?? null,
    minPrice:
      listing.minPrice ??
      (Array.isArray(listing.rooms) && listing.rooms.length
        ? Math.min(
            ...listing.rooms
              .map((room) => Number(room.pricePerNight || room.price || 0))
              .filter((n) => Number.isFinite(n) && n > 0)
          )
        : null),
    images: Array.isArray(listing.images)
      ? listing.images
      : typeof listing.imagesJson === 'string'
        ? (() => {
            try {
              const parsed = JSON.parse(listing.imagesJson);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          })()
        : [],
  };
}

async function loadLocalHotel(id) {
  const listing = await prisma.listing.findUnique({
    where: { id: String(id) },
    include: { rooms: true },
  });

  return mapListingToHotel(listing);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const hotel = await loadHotelDetails(req.query.id);
    return res.status(200).json(hotel);
  } catch (err) {
    try {
      const hotel = await loadLocalHotel(req.query.id);
      if (hotel) {
        return res.status(200).json(hotel);
      }

      return res.status(404).json({ error: 'Hotel not found' });
    } catch (fallbackErr) {
      return res.status(500).json({
        error: err.message || fallbackErr.message || 'Failed to load hotel',
      });
    }
  }
}