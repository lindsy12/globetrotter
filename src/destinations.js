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

/**
 * @swagger
 * /destinations/{id}:
 *   get:
 *     summary: Get a single destination by id
 *     tags: [Destinations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Destination id
 *     responses:
 *       200:
 *         description: The destination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: destination not found
 */
router.get('/destinations/:id', (req, res) => {
  const destination = getAllDestinations().find((d) => d.id === req.params.id);
  if (!destination) {
    return res.status(404).json({ error: 'destination not found' });
  }
  res.json(destination);
});

module.exports = router;
