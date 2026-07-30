/**
 * src/destinations.js
 *
 * Destination search endpoint.
 * Equivalent of the lecturer's app/destinations.py.
 *
 * Route: GET /destinations
 * Query params: q (free text), tag
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
 *         description: Free-text search against the destination's name, description, and neighborhood
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by a single interest tag (e.g. museum)
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
  const { q, tag } = req.query;

  if (q) {
    const query = q.toLowerCase();
    results = results.filter((d) =>
      d.name.toLowerCase().includes(query) ||
      (d.description || '').toLowerCase().includes(query) ||
      (d.neighborhood || '').toLowerCase().includes(query)
    );
  }

  if (tag) {
    results = results.filter((d) => (d.tags || []).includes(tag.toLowerCase()));
  }

  res.json(results);
});

module.exports = router;
