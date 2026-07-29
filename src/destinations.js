/**
 * src/destinations.js
 *
 * Destination search endpoint.
 * Equivalent of the lecturer's app/destinations.py.
 *
 * Route: GET /destinations
 * Query params: q (free text), tag, continent, max_cost
 */
const express = require('express');
const { getAllDestinations } = require('./models');

const router = express.Router();

/**
 * @swagger
 * /destinations:
 *   get:
 *     summary: Search the destination catalogue
 *     tags: [Destinations]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Free-text search against the destination name
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by a single interest tag (e.g. beach)
 *       - in: query
 *         name: continent
 *         schema:
 *           type: string
 *         description: Filter by continent name
 *       - in: query
 *         name: max_cost
 *         schema:
 *           type: number
 *         description: Filter by maximum cost
 *     responses:
 *       200:
 *         description: A list of matching destinations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/destinations', (req, res) => {
  let results = getAllDestinations();
  const { q, tag, continent, max_cost: maxCost } = req.query;

  if (q) {
    const query = q.toLowerCase();
    results = results.filter((d) => d.name.toLowerCase().includes(query));
  }

  if (tag) {
    results = results.filter((d) => (d.tags || []).includes(tag.toLowerCase()));
  }

  if (continent) {
    results = results.filter(
      (d) => (d.continent || '').toLowerCase() === continent.toLowerCase()
    );
  }

  if (maxCost) {
    const max = parseFloat(maxCost);
    if (!Number.isNaN(max)) {
      results = results.filter((d) => (d.cost || 0) <= max);
    }
  }

  res.json(results);
});

module.exports = router;
