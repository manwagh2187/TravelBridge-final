'use strict';

const express = require('express');
const flightController = require('../controllers/flightController');

const router = express.Router();

// GET /api/flights/search
router.get('/search', flightController.searchFlights);

// POST /api/flights/price
router.post('/price', flightController.priceFlight);

// POST /api/flights/book
router.post('/book', flightController.bookFlight);

module.exports = router;