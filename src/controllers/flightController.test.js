'use strict';

const flightController = require('../../src/controllers/flightController');
const amadeusService = require('../../src/services/amadeusService');

jest.mock('../../src/services/amadeusService');

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('flightController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchFlights', () => {
    it('returns 200 with search results', async () => {
      const req = { query: { originLocationCode: 'NYC' } };
      const res = createRes();

      amadeusService.searchFlights.mockResolvedValueOnce({ data: [{ id: '1' }] });

      await flightController.searchFlights(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: [{ id: '1' }] });
    });

    it('returns 400 on service error', async () => {
      const req = { query: {} };
      const res = createRes();

      amadeusService.searchFlights.mockRejectedValueOnce(new Error('search failed'));

      await flightController.searchFlights(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'search failed' });
    });
  });

  describe('priceFlight', () => {
    it('returns 200 with pricing response', async () => {
      const req = { body: { data: { flightOffers: [{ id: '1' }] } } };
      const res = createRes();

      amadeusService.priceFlight.mockResolvedValueOnce({ data: { type: 'flight-offers-pricing' } });

      await flightController.priceFlight(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: { type: 'flight-offers-pricing' } });
    });

    it('returns 400 on pricing error', async () => {
      const req = { body: {} };
      const res = createRes();

      amadeusService.priceFlight.mockRejectedValueOnce(new Error('Invalid price request payload'));

      await flightController.priceFlight(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid price request payload' });
    });
  });

  describe('bookFlight', () => {
    it('returns 200 with booking skeleton response', async () => {
      const req = {
        body: {
          data: { flightOffers: [{ id: '1' }] },
          travelers: [{ id: '1', travelerType: 'ADULT' }]
        }
      };
      const res = createRes();

      amadeusService.bookFlight.mockResolvedValueOnce({
        status: 'not_implemented',
        message: 'Flight booking endpoint is validated but not implemented yet'
      });

      await flightController.bookFlight(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'not_implemented',
        message: 'Flight booking endpoint is validated but not implemented yet'
      });
    });

    it('returns 400 on booking validation error', async () => {
      const req = { body: { data: {}, travelers: [] } };
      const res = createRes();

      amadeusService.bookFlight.mockRejectedValueOnce(
        new Error('Booking requires at least one flight offer')
      );

      await flightController.bookFlight(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Booking requires at least one flight offer'
      });
    });
  });
});