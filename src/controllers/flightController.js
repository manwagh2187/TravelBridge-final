'use strict';

const amadeusService = require('../services/amadeusService');

function handleError(res, error) {
  const message = error && error.message ? error.message : 'Unexpected error';
  return res.status(400).json({ error: message });
}

async function searchFlights(req, res) {
  try {
    const result = await amadeusService.searchFlights(req.query || {});
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

async function priceFlight(req, res) {
  try {
    const result = await amadeusService.priceFlight(req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

async function bookFlight(req, res) {
  try {
    const result = await amadeusService.bookFlight(req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

module.exports = {
  searchFlights,
  priceFlight,
  bookFlight
};