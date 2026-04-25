# TravelBridge - Booking MVP (Final)

This repo contains a working MVP for a hotel booking app with:
- Next.js frontend & API routes
- Prisma ORM (Postgres)
- Stripe Checkout + webhook handler
- Availability checking using transactions
- Docker Compose with Postgres for local development

Quick start (Docker + local)

1. Copy env:
   cp .env.example .env
   Edit .env: set JWT_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET (use Stripe test keys for local testing)

2. Start Postgres (docker-compose):
   docker compose up -d db

3. Install dependencies:
   npm install

4. Generate Prisma client:
   npx prisma generate

5. Run migrations (may prompt):
   npx prisma migrate dev --name init

6. Seed the database:
   npm run prisma:seed

7. Start dev server:
   npm run dev

8. For webhook testing locally (Stripe CLI):
   stripe login
   stripe listen --forward-to localhost:3000/api/payments/webhook

Seeded user:
  email: alice@example.com
  password: password

Notes:
- Amounts in the seeded data are in the smallest currency unit (e.g. cents for USD). Adjust currency & pricing as needed.
- For production use a managed Postgres, secure JWT_SECRET, HTTPS, and set the correct STRIPE keys & webhook endpoint.