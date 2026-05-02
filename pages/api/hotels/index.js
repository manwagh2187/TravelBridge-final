import prisma from '../../../lib/prisma';
import { searchIndiaHotels } from '../../../lib/hotel-service';

function mapListingToHotel(listing) {
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
    imagesJson: Array.isArray(listing.images)
      ? JSON.stringify(listing.images)
      : listing.imagesJson || '[]',
  };
}

async function loadLocalListings(city) {
  const where = {};
  if (city) {
    where.city = { contains: city, mode: 'insensitive' };
  }

  const listings = await prisma.listing.findMany({
    where,
    include: { rooms: true },
  });

  return listings.map(mapListingToHotel);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { city } = req.query;

  try {
    const result = await searchIndiaHotels(req.query);
    const hotels = Array.isArray(result?.hotels) ? result.hotels : [];

    if (hotels.length) {
      return res.status(200).json(hotels);
    }

    const localHotels = await loadLocalListings(city);
    return res.status(200).json(localHotels);
  } catch (err) {
    try {
      const localHotels = await loadLocalListings(city);
      return res.status(200).json(localHotels);
    } catch (fallbackErr) {
      return res.status(500).json({
        error: err.message || fallbackErr.message || 'Failed to load hotels',
      });
    }
  }
}