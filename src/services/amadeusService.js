'use strict';

const axios = require('axios');
const { validateBookingPayload } = require('../validation/flightBookingSchema');
const { mapAmadeusError } = require('../utils/errorMapper');

const AMADEUS_BASE_URL =
  process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com';
const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;

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

async function bookFlight(payload) {
  const { value, error } = validateBookingPayload(payload);
  if (error) {
    const validationErr = new Error('Invalid booking payload');
    validationErr.statusCode = 400;
    validationErr.details = error;
    throw validationErr;
  }

  const token = await getAccessToken();

  try {
    const { data } = await axios.post(
      `${AMADEUS_BASE_URL}/v1/booking/flight-orders`,
      value,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      }
    );

    return data;
  } catch (err) {
    const mapped = mapAmadeusError(err, 'Flight booking failed');
    const bookingErr = new Error(mapped.error);
    bookingErr.statusCode = mapped.status;
    bookingErr.details = mapped.details;
    throw bookingErr;
  }
}

module.exports = {
  getAccessToken,
  searchFlights,
  priceFlight,
  bookFlight
};