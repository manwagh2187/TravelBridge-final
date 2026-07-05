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
} = require('./amadeusService');

describe('amadeusService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('books flight successfully with valid payload', async () => {
    axios.post
      .mockResolvedValueOnce({ data: { access_token: 'mock_token' } }) // token
      .mockResolvedValueOnce({ data: { data: { id: 'order-123', type: 'flight-order' } } }); // booking

    const payload = {
      data: {
        type: 'flight-order',
        flightOffers: [{ type: 'flight-offer', id: 'offer-1' }],
        travelers: [
          {
            id: '1',
            dateOfBirth: '1990-01-01',
            name: { firstName: 'John', lastName: 'Doe' },
            gender: 'MALE',
            contact: {
              emailAddress: 'john@example.com',
              phones: [{ deviceType: 'MOBILE', countryCallingCode: '91', number: '9999999999' }]
            },
            documents: [
              {
                documentType: 'PASSPORT',
                number: 'A1234567',
                expiryDate: '2030-01-01',
                issuanceCountry: 'IN',
                validityCountry: 'IN',
                nationality: 'IN',
                holder: true
              }
            ]
          }
        ]
      }
    };

    const result = await bookFlight(payload);
    expect(result).toEqual({ data: { id: 'order-123', type: 'flight-order' } });
  });

  it('throws validation error for invalid booking payload', async () => {
    await expect(bookFlight({ data: { type: 'flight-order', flightOffers: [] } })).rejects.toMatchObject({
      message: 'Invalid booking payload',
      statusCode: 400
    });
  });

  it('maps and redacts upstream booking errors', async () => {
    axios.post
      .mockResolvedValueOnce({ data: { access_token: 'mock_token' } })
      .mockRejectedValueOnce({
        response: {
          status: 422,
          data: {
            errors: [
              {
                code: 32171,
                title: 'INVALID DATA RECEIVED',
                detail: 'traveler information is incomplete'
              }
            ]
          }
        }
      });

    const payload = {
      data: {
        type: 'flight-order',
        flightOffers: [{ type: 'flight-offer', id: 'offer-1' }],
        travelers: [
          {
            id: '1',
            dateOfBirth: '1990-01-01',
            name: { firstName: 'John', lastName: 'Doe' },
            gender: 'MALE',
            contact: {
              emailAddress: 'john@example.com',
              phones: [{ deviceType: 'MOBILE', countryCallingCode: '91', number: '9999999999' }]
            },
            documents: [
              {
                documentType: 'PASSPORT',
                number: 'A1234567',
                expiryDate: '2030-01-01',
                issuanceCountry: 'IN',
                validityCountry: 'IN',
                nationality: 'IN',
                holder: true
              }
            ]
          }
        ]
      }
    };

    await expect(bookFlight(payload)).rejects.toMatchObject({
      message: 'Flight booking failed',
      statusCode: 422,
      details: [
        expect.objectContaining({
          title: 'INVALID DATA RECEIVED'
        })
      ]
    });
  });
});