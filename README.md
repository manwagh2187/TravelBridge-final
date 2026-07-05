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

  ### Flight API endpoints

- `GET /api/flights/search`  
  Query params are forwarded to Amadeus flight offers search.

- `POST /api/flights/price`  
  Prices selected flight offers via Amadeus pricing API.

- `POST /api/flights/book`  
  Currently validates payload and returns a `not_implemented` response.

  ### Flight booking (production-ready)

`POST /api/flights/book` now forwards validated payloads to Amadeus Flight Orders API.

#### Validation
- Enforced with Joi schema (`src/validation/flightBookingSchema.js`)
- Requires:
  - `data.type = "flight-order"`
  - at least one `flightOffers[]`
  - at least one `travelers[]` with name, DOB, contact, documents

#### Error handling
- Upstream Amadeus errors are mapped through `src/utils/errorMapper.js`
- Sensitive fields (tokens, headers, stack traces) are never exposed in API responses
- Client receives safe shape:
  - `error`
  - `status` (mapped HTTP code)
  - `details[]` (sanitized code/title/detail/source)