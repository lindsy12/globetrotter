const fs = require('fs');
const os = require('os');
const path = require('path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'globetrotter-test-'));
process.env.DATA_DIR = tmpDir;

const request = require('supertest');
const app = require('../src/app');

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

let tokenA;
let tokenB;
let itineraryId;

beforeAll(async () => {
  await request(app).post('/register').send({ username: 'ownerA', password: 'pw12345' });
  await request(app).post('/register').send({ username: 'ownerB', password: 'pw12345' });

  const loginA = await request(app).post('/login').send({ username: 'ownerA', password: 'pw12345' });
  tokenA = loginA.body.token;

  const loginB = await request(app).post('/login').send({ username: 'ownerB', password: 'pw12345' });
  tokenB = loginB.body.token;
});

describe('POST /itineraries', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await request(app)
      .post('/itineraries')
      .send({ title: 'Trip', destinations: ['A'] });

    expect(res.status).toBe(401);
  });

  it('creates an itinerary for the logged-in user', async () => {
    const res = await request(app)
      .post('/itineraries')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Weekend Trip', destinations: ['Test Hotel'], notes: 'fun' });

    expect(res.status).toBe(201);
    expect(res.body.username).toBe('ownerA');
    itineraryId = res.body.id;
  });

  it('rejects a missing title/destinations', async () => {
    const res = await request(app)
      .post('/itineraries')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: '', destinations: [] });

    expect(res.status).toBe(400);
  });
});

describe('GET /itineraries', () => {
  it("returns only the logged-in user's itineraries", async () => {
    const res = await request(app)
      .get('/itineraries')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(itineraryId);
  });

  it("does not leak owner A's itineraries to owner B", async () => {
    const res = await request(app)
      .get('/itineraries')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

describe('GET /itineraries/:id', () => {
  it('is publicly readable without auth (share link)', async () => {
    const res = await request(app).get(`/itineraries/${itineraryId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(itineraryId);
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get('/itineraries/does-not-exist');
    expect(res.status).toBe(404);
  });
});

describe('PUT /itineraries/:id', () => {
  it('rejects an update from a non-owner', async () => {
    const res = await request(app)
      .put(`/itineraries/${itineraryId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Hijacked', destinations: ['X'] });

    expect(res.status).toBe(403);
  });

  it('lets the owner update it', async () => {
    const res = await request(app)
      .put(`/itineraries/${itineraryId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Updated Trip', destinations: ['Test Hotel'], notes: 'still fun' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Trip');
  });
});

describe('DELETE /itineraries/:id', () => {
  it('rejects a delete from a non-owner', async () => {
    const res = await request(app)
      .delete(`/itineraries/${itineraryId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
  });

  it('lets the owner delete it', async () => {
    const res = await request(app)
      .delete(`/itineraries/${itineraryId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
  });

  it('returns 404 once deleted', async () => {
    const res = await request(app).get(`/itineraries/${itineraryId}`);
    expect(res.status).toBe(404);
  });
});
