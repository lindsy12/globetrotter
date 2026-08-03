const fs = require('fs');
const os = require('os');
const path = require('path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'globetrotter-test-'));
process.env.DATA_DIR = tmpDir;

// A small, self-contained fixture — deliberately not the real seed data,
// so these tests stay deterministic regardless of what's in the real catalogue.
const fixtureDestinations = [
  {
    id: 'test-001',
    name: 'Test Hotel',
    neighborhood: 'Centre-ville',
    description: 'A hotel for testing.',
    tags: ['hotel', 'budget-friendly'],
    community_verified: true,
    popularity: 80,
    latitude: 3.848,
    longitude: 11.502,
  },
  {
    id: 'test-002',
    name: 'Test Museum',
    neighborhood: 'Bastos',
    description: 'A museum for testing.',
    tags: ['museum', 'culture'],
    community_verified: false,
    popularity: 40,
    latitude: 3.89,
    longitude: 11.52,
  },
];

fs.writeFileSync(
  path.join(tmpDir, 'destinations.json'),
  JSON.stringify(fixtureDestinations, null, 2)
);

const request = require('supertest');
const app = require('../src/app');

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('GET /destinations', () => {
  it('returns all destinations with no filters', async () => {
    const res = await request(app).get('/destinations');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it('filters by tag', async () => {
    const res = await request(app).get('/destinations?tag=museum');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Test Museum');
  });

  it('filters by free-text search across name/description/neighborhood', async () => {
    const res = await request(app).get('/destinations?q=hotel');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Test Hotel');
  });
});

describe('GET /destinations/:id', () => {
  it('returns a destination by id', async () => {
    const res = await request(app).get('/destinations/test-001');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Test Hotel');
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get('/destinations/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('destination not found');
  });
});
