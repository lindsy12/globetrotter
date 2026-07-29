/**
 * src/auth.js
 *
 * User registration, login, and JWT handling.
 * Equivalent of the lecturer's app/auth.py.
 *
 * Routes:
 *   POST /register  - create a new user account
 *   POST /login     - authenticate and return a JWT token
 */
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const { getUserByUsername, saveUser } = require('./models');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'globetrotter-dev-secret-change-me';

// ---------------------------------------------------------------------------
// Helper – JWT utilities
// ---------------------------------------------------------------------------

/** Return a signed JWT for `username`, valid for 24 hours. */
function createToken(username) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: username,
    iat: now,
    exp: now + 24 * 60 * 60, // 24 hours, matching lecturer's expiry
  };
  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
}

/** Decode and verify a token. Throws if invalid/expired. */
function decodeToken(token) {
  return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
}

/**
 * Extract and validate the JWT from the Authorization header.
 * Returns the username (subject claim), or null if missing/invalid —
 * matches his get_current_user(): no auto-rejection here, each route
 * decides what to do with the result.
 */
function getCurrentUser(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = decodeToken(token);
    return payload.sub;
  } catch (err) {
    return null;
  }
}

/**
 * Express middleware that requires a valid JWT.
 * Responds 401 and stops the chain if missing/invalid, otherwise
 * attaches the username to req.user and calls next().
 */
function requireAuth(req, res, next) {
  const username = getCurrentUser(req);
  if (!username) {
    return res.status(401).json({ error: 'authentication required' });
  }
  req.user = username;
  next();
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * POST /register
 * Body: { username, password, preferences? }
 *
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               preferences:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 username:
 *                   type: string
 *       400:
 *         description: username and password are required
 *       409:
 *         description: username already exists
 */
router.post('/register', (req, res) => {
  const username = (req.body.username || '').trim();
  const password = req.body.password || '';
  const preferences = req.body.preferences || [];

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  if (getUserByUsername(username)) {
    return res.status(409).json({ error: 'username already exists' });
  }

  const user = {
    id: uuidv4(),
    username,
    password_hash: bcrypt.hashSync(password, 10),
    preferences,
  };

  saveUser(user);
  return res.status(201).json({ message: 'user registered successfully', username });
});

/**
 * POST /login
 * Body: { username, password }
 *
 * @swagger
 * /login:
 *   post:
 *     summary: Authenticate and receive a JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: username and password are required
 *       401:
 *         description: invalid credentials
 */
router.post('/login', (req, res) => {
  const username = (req.body.username || '').trim();
  const password = req.body.password || '';

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const user = getUserByUsername(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const token = createToken(username);
  return res.status(200).json({ token });
});

module.exports = { router, getCurrentUser, requireAuth };
