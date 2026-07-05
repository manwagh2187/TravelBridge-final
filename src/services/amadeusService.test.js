'use strict';

process.env.AMADEUS_CLIENT_ID = 'test_client_id';
process.env.AMADEUS_CLIENT_SECRET = 'test_client_secret';
process.env.AMADEUS_BASE_URL = 'https://test.api.amadeus.com';

const axios = require('axios');
jest.mock('axios');

const {
  getAccessToken,
  searchFlights,
  priceFlight,
  bookFlight
} = require('../../src/services/amadeusService');

describe('amadeusService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAccessToken', () => {
    it('returns access token when auth call succeeds', async () => {
      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock_token' }
      });

      const token = await getAccessToken();

      expect(token).toBe('mock_token');
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post.mock.calls[0][0]).toContain('/v1/security/oauth2/token');
    });

    it('throws when token is missing in response', async () => {
      axios.post.mockResolvedValueOnce({ data: {} });

      await expect(getAccessToken()).rejects.toThrow(
        'Unable to retrieve Amadeus access token'
      );
    });
  });

  describe('searchFlights', () => {
    it('calls flight offers search with bearer token', async () => {
      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock_token' }
      });

      axios.get.mockResolvedValueOnce({
        data: { data: [{ id: 'offer-1' }] }
      });

      const result = await searchFlights({
        originLocationCode: 'NYC',
        destinationLocationCode: 'LAX',
        departureDate: '2026-08-01',
        adults: 1
      });

      expect(result).toEqual({ data: [{ id: 'offer-1' }] });
      expect(axios.get).toHaveBeenCalledTimes(1);

      const [, config] = axios.get.mock.calls[0];
      expect(config.headers.Authorization).toBe('Bearer mock_token');
    });
  });

  describe('priceFlight', () => {
    it('calls pricing endpoint and returns priced response', async () => {
      axios.post
        .mockResolvedValueOnce({ data: { access_token: 'mock_token' } })
        .mockResolvedValueOnce({
          data: { data: { type: 'flight-offers-pricing' } }
        });

      const payload = {
        data: {
          type: 'flight-offers-pricing',
          flightOffers: [{ id: 'offer-1' }]
        }
      };

      const result = await priceFlight(payload);

      expect(result).toEqual({ data: { type: 'flight-offers-pricing' } });
      expect(axios.post).toHaveBeenCalledTimes(2);
      expect(axios.post.mock.calls[1][0]).toContain(
        '/v1/shopping/flight-offers/pricing'
      );
    });

    it('throws on invalid pricing payload', async () => {
      await expect(priceFlight({})).rejects.toThrow('Invalid price request payload');
    });
  });

  describe('bookFlight', () => {
    it('returns not_implemented for valid payload', async () => {
      const result = await bookFlight({
        data: { flightOffers: [{ id: 'offer-1' }] },
        travelers: [{ id: '1', travelerType: 'ADULT' }]
      });

      expect(result.status).toBe('not_implemented');
    });

    it('throws when flightOffers are missing', async () => {
      await expect(
        bookFlight({ data: {}, travelers: [{ id: '1' }] })
      ).rejects.toThrow('Booking requires at least one flight offer');
    });

    it('throws when travelers are missing', async () => {
      await expect(
        bookFlight({ data: { flightOffers: [{ id: 'offer-1' }] }, travelers: [] })
      ).rejects.toThrow('Booking requires at least one traveler');
    });
  });
});