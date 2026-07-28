/**
 * src/recommendations.js
 *
 * Personalized destination recommendations.
 * Equivalent of the lecturer's app/recommendations.py.
 *
 * Route: GET /recommendations (auth required)
 * Based on the logged-in user's stored preference tags — NOT itinerary history.
 */
const express = require('express');
const { getAllDestinations, getUserByUsername } = require('./models');
const { getCurrentUser } = require('./auth');

const router = express.Router();

router.get('/recommendations', (req, res) => {
  const username = getCurrentUser(req);
  if (!username) {
    return res.status(401).json({ error: 'authentication required' });
  }

  const user = getUserByUsername(username);
  const preferences = (user && user.preferences) || [];

  const destinations = getAllDestinations();

  if (preferences.length === 0) {
    return res.json(destinations.slice(0, 5));
  }

  const matches = destinations.filter((d) =>
    (d.tags || []).some((tag) => preferences.includes(tag))
  );

  return res.json(matches);
});

module.exports = router;
