import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password', 10);

  await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice',
      password,
    },
  });

  const listings = [
    {
      title: 'Cozy City Hotel',
      description: 'Comfortable rooms in the city center with modern amenities and easy access to dining and transit.',
      city: 'Bangkok',
      country: 'Thailand',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1560067174-8943bd7d3a45?auto=format&fit=crop&w=1200&q=80'
      ]),
      rooms: {
        create: [
          { title: 'Standard Room', capacity: 2, pricePerNight: 3000, inventory: 5 },
          { title: 'Deluxe Room', capacity: 3, pricePerNight: 5000, inventory: 2 },
        ],
      },
    },
    {
      title: 'Skyline Grand',
      description: 'Premium stay with skyline views, rooftop dining, and elegant interiors for a luxurious city break.',
      city: 'Singapore',
      country: 'Singapore',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1501117716987-c8e1ecb2108d?auto=format&fit=crop&w=1200&q=80'
      ]),
      rooms: {
        create: [
          { title: 'City View Room', capacity: 2, pricePerNight: 8000, inventory: 8 },
          { title: 'Premier Suite', capacity: 4, pricePerNight: 14000, inventory: 3 },
        ],
      },
    },
    {
      title: 'Island Escape Resort',
      description: 'A relaxing tropical resort with pools, spa, and beach access for a premium leisure getaway.',
      city: 'Bali',
      country: 'Indonesia',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80'
      ]),
      rooms: {
        create: [
          { title: 'Garden Villa', capacity: 2, pricePerNight: 6500, inventory: 6 },
          { title: 'Pool Villa', capacity: 4, pricePerNight: 12000, inventory: 2 },
        ],
      },
    },
  ];

  for (const listing of listings) {
    await prisma.listing.create({ data: listing });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });