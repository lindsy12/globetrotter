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
const { requireAuth } = require('./auth');

const router = express.Router();

/**
 * @swagger
 * /recommendations:
 *   get:
 *     summary: Get personalized destination recommendations
 *     description: >
 *       Filters the destination catalogue by the logged-in user's stored
 *       preference tags. If the user has no preferences set, returns the
 *       first 5 destinations instead.
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommended destinations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: authentication required
 */
router.get('/recommendations', requireAuth, (req, res) => {
  const user = getUserByUsername(req.user);
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
