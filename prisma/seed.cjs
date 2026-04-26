const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

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

  await prisma.listing.create({
    data: {
      title: 'Cozy City Hotel',
      description: 'Comfortable rooms in the city center with modern amenities and easy access to dining and transit.',
      city: 'Bangkok',
      country: 'Thailand',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80'
      ]),
      rooms: {
        create: [
          { title: 'Standard Room', capacity: 2, pricePerNight: 3000, inventory: 5 },
        ],
      },
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });