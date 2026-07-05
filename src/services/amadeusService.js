'use strict';

const axios = require('axios');

const AMADEUS_BASE_URL =
  process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com';
const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;

/**
 * Get OAuth token from Amadeus
 */
async function getAccessToken() {
  if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
    throw new Error('Missing Amadeus credentials in environment variables');
  }

  const form = new URLSearchParams();
  form.append('grant_type', 'client_credentials');
  form.append('client_id', AMADEUS_CLIENT_ID);
  form.append('client_secret', AMADEUS_CLIENT_SECRET);

  const { data } = await axios.post(
    `${AMADEUS_BASE_URL}/v1/security/oauth2/token`,
    form.toString(),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000
    }
  );

  if (!data || !data.access_token) {
    throw new Error('Unable to retrieve Amadeus access token');
  }

  return data.access_token;
}

/**
 * Flight offers search
 */
async function searchFlights(params) {
  const token = await getAccessToken();

  const { data } = await axios.get(
    `${AMADEUS_BASE_URL}/v2/shopping/flight-offers`,
    {
      params,
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000
    }
  );

  return data;
}

/**
 * Price flight offers
 * Expects payload in Amadeus flight-offers-pricing format:
 * { data: { type: "flight-offers-pricing", flightOffers: [...] } }
 */
async function priceFlight(payload) {
  if (!payload || !payload.data || !Array.isArray(payload.data.flightOffers)) {
    throw new Error('Invalid price request payload');
  }

  const token = await getAccessToken();

  const { data } = await axios.post(
    `${AMADEUS_BASE_URL}/v1/shopping/flight-offers/pricing`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    }
  );

  return data;
}

/**
 * Booking skeleton with validation only.
 * NOTE: This is intentionally not calling production booking yet.
 */
async function bookFlight(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid booking payload');
  }

  if (!payload.data || !Array.isArray(payload.data.flightOffers) || payload.data.flightOffers.length === 0) {
    throw new Error('Booking requires at least one flight offer');
  }

  if (!Array.isArray(payload.travelers) || payload.travelers.length === 0) {
    throw new Error('Booking requires at least one traveler');
  }

  return {
    status: 'not_implemented',
    message: 'Flight booking endpoint is validated but not implemented yet'
  };
}

module.exports = {
  getAccessToken,
  searchFlights,
  priceFlight,
  bookFlight
};