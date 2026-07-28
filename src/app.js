/**
 * src/app.js
 *
 * Express application entry point.
 * Equivalent of the lecturer's app/__init__.py + app/main.py combined.
 */
const express = require('express');

const { router: authRouter } = require('./auth');
const destinationsRouter = require('./destinations');
const itinerariesRouter = require('./itineraries');
const recommendationsRouter = require('./recommendations');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.use('/', authRouter);
app.use('/', destinationsRouter);
app.use('/', itinerariesRouter);
app.use('/', recommendationsRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`GlobeTrotter monolith running on http://localhost:${PORT}`);
});
