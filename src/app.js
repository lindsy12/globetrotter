const path = require('path');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const { router: authRouter } = require('./auth');
const destinationsRouter = require('./destinations');
const itinerariesRouter = require('./itineraries');
const recommendationsRouter = require('./recommendations');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Serve the static frontend; index:false so our own "/" route (below)
// decides what the site root serves instead of an auto-served index.html.
app.use(express.static(PUBLIC_DIR, { index: false }));

app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'discover.html'));
});

app.use('/', authRouter);
app.use('/', destinationsRouter);
app.use('/', itinerariesRouter);
app.use('/', recommendationsRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message =
    err.type === 'entity.parse.failed' ? 'malformed JSON in request body' : err.message || 'internal server error';
  res.status(status).json({ error: message });
});

const PORT = process.env.PORT || 3000;

// Only bind a port when this file is run directly (node src/app.js) —
// not when a test file requires the app to hand it to Supertest, which
// binds its own ephemeral port per test run instead.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`GlobeTrotter monolith running on http://localhost:${PORT}`);
  });
}

module.exports = app;