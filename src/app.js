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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`GlobeTrotter monolith running on http://localhost:${PORT}`);
});