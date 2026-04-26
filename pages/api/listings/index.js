import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { city } = req.query;
  const where = {};

  if (city) {
    where.city = { contains: city, mode: 'insensitive' };
  }

  const listings = await prisma.listing.findMany({
    where,
    include: { rooms: true },
  });

  res.json(listings);
}