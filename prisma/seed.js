const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const pass = await bcrypt.hash('password', 10);
  await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { email: 'alice@example.com', name: 'Alice', password: pass }
  });

  await prisma.listing.create({
    data: {
      title: 'Cozy City Hotel',
      description: 'Comfortable rooms in the city center.',
      city: 'Bangkok',
      country: 'Thailand',
      images: JSON.stringify(['https://placehold.co/600x400','https://placehold.co/600x400']),
      rooms: {
        create: [
          { title: 'Standard Room', capacity: 2, pricePerNight: 3000, inventory: 5 },
          { title: 'Deluxe Room', capacity: 3, pricePerNight: 5000, inventory: 2 }
        ]
      }
    }
  });
}
main().catch(e => { console.error(e); process.exit(1) }).finally(async () => await new (require('@prisma/client').PrismaClient)().$disconnect())