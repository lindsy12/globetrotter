/**
 * src/itineraries.js
 *
 * Create and list itineraries.
 * Equivalent of the lecturer's app/itineraries.py.
 *
 * Routes:
 *   POST /itineraries - create a new itinerary (auth required)
 *   GET  /itineraries - list the logged-in user's itineraries (auth required)
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getItinerariesForUser, saveItinerary } = require('./models');
const { getCurrentUser } = require('./auth');

const router = express.Router();

router.post('/itineraries', (req, res) => {
  const username = getCurrentUser(req);
  if (!username) {
    return res.status(401).json({ error: 'authentication required' });
  }

  const { title, destinations, notes } = req.body;

  if (!title || !Array.isArray(destinations) || destinations.length === 0) {
    return res.status(400).json({ error: 'title and destinations[] are required' });
  }

  const itinerary = {
    id: uuidv4(),
    username,
    title,
    destinations, // array of destination NAMES, matching lecturer's design
    notes: notes || '',
  };

  saveItinerary(itinerary);
  return res.status(201).json(itinerary);
});

router.get('/itineraries', (req, res) => {
  const username = getCurrentUser(req);
  if (!username) {
    return res.status(401).json({ error: 'authentication required' });
  }

  const mine = getItinerariesForUser(username);
  return res.json(mine);
});

module.exports = router;
