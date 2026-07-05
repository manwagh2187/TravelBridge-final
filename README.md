# TravelBridge-final

A Next.js + Prisma + PostgreSQL hotel booking MVP with Stripe checkout.

## Features
- Search hotel listings by city
- Agoda-style listings UI
- Listing detail pages
- JWT login/signup/logout
- Booking creation
- Stripe checkout session creation
- Webhook confirmation
- Docker Compose support

## Requirements
- Node.js 18+
- PostgreSQL 15+
- Stripe test keys for payment flow

## Setup

### 1. Install dependencies
```bash
npm install
## Flight Pricing and Booking (Amadeus)

### Pricing endpoint behavior

The service supports pricing flight offers through Amadeus Flight Offers Pricing API.

- Service method: `priceFlight(payload)`
- Required payload shape:
  ```json
  {
    "data": {
      "type": "flight-offers-pricing",
      "flightOffers": [ /* one or more offers */ ]
    }
  }