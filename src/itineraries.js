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
const {
  getItinerariesForUser,
  getItineraryById,
  saveItinerary,
  updateItinerary,
  deleteItinerary,
} = require('./models');
const { requireAuth } = require('./auth');

const router = express.Router();

/**
 * @swagger
 * /itineraries:
 *   post:
 *     summary: Create a new itinerary
 *     tags: [Itineraries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - destinations
 *             properties:
 *               title:
 *                 type: string
 *               destinations:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Destination names
 *               notes:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 example: "2026-08-14"
 *               end_date:
 *                 type: string
 *                 example: "2026-08-20"
 *     responses:
 *       201:
 *         description: Itinerary created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: title and destinations[] are required
 *       401:
 *         description: authentication required
 */
router.post('/itineraries', requireAuth, (req, res) => {
  const username = req.user;

  const { title, destinations, notes, start_date: startDate, end_date: endDate } = req.body;

  if (!title || !Array.isArray(destinations) || destinations.length === 0) {
    return res.status(400).json({ error: 'title and destinations[] are required' });
  }

  const itinerary = {
    id: uuidv4(),
    username,
    title,
    destinations, // array of destination NAMES, matching lecturer's design
    notes: notes || '',
    start_date: startDate || null,
    end_date: endDate || null,
  };

  saveItinerary(itinerary);
  return res.status(201).json(itinerary);
});

/**
 * @swagger
 * /itineraries:
 *   get:
 *     summary: List the logged-in user's itineraries
 *     tags: [Itineraries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The user's itineraries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: authentication required
 */
router.get('/itineraries', requireAuth, (req, res) => {
  const mine = getItinerariesForUser(req.user);
  return res.json(mine);
});

/**
 * GET /itineraries/:id
 * Public — no authentication required, acts as a shareable link.
 *
 * @swagger
 * /itineraries/{id}:
 *   get:
 *     summary: Get a single itinerary by id (public, shareable link)
 *     tags: [Itineraries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Itinerary id
 *     responses:
 *       200:
 *         description: The itinerary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: itinerary not found
 */
router.get('/itineraries/:id', (req, res) => {
  const itinerary = getItineraryById(req.params.id);
  if (!itinerary) {
    return res.status(404).json({ error: 'itinerary not found' });
  }
  return res.json(itinerary);
});

/**
 * @swagger
 * /itineraries/{id}:
 *   put:
 *     summary: Update an itinerary (owner only)
 *     tags: [Itineraries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Itinerary id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               destinations:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 example: "2026-08-14"
 *               end_date:
 *                 type: string
 *                 example: "2026-08-20"
 *     responses:
 *       200:
 *         description: The updated itinerary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: authentication required
 *       403:
 *         description: you do not own this itinerary
 *       404:
 *         description: itinerary not found
 */
router.put('/itineraries/:id', requireAuth, (req, res) => {
  const { title, destinations, notes, start_date: startDate, end_date: endDate } = req.body;

  const result = updateItinerary(req.params.id, req.user, {
    title,
    destinations,
    notes,
    start_date: startDate,
    end_date: endDate,
  });

  if (result.error === 'not_found') {
    return res.status(404).json({ error: 'itinerary not found' });
  }
  if (result.error === 'forbidden') {
    return res.status(403).json({ error: 'you do not own this itinerary' });
  }
  return res.status(200).json(result.itinerary);
});

/**
 * @swagger
 * /itineraries/{id}:
 *   delete:
 *     summary: Delete an itinerary (owner only)
 *     tags: [Itineraries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Itinerary id
 *     responses:
 *       200:
 *         description: Itinerary deleted
 *       401:
 *         description: authentication required
 *       403:
 *         description: you do not own this itinerary
 *       404:
 *         description: itinerary not found
 */
router.delete('/itineraries/:id', requireAuth, (req, res) => {
  const result = deleteItinerary(req.params.id, req.user);

  if (result.error === 'not_found') {
    return res.status(404).json({ error: 'itinerary not found' });
  }
  if (result.error === 'forbidden') {
    return res.status(403).json({ error: 'you do not own this itinerary' });
  }
  return res.status(200).json({ message: 'itinerary deleted' });
});

module.exports = router;
