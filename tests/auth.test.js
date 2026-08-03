const fs = require('fs');
const os = require('os');
const path = require('path');

// Point the app at an isolated temp data directory for this test file only,
// so tests never read/write the real src/data/*.json files.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'globetrotter-test-'));
process.env.DATA_DIR = tmpDir;

const request = require('supertest');
const app = require('../src/app');

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('POST /register', () => {
  it('creates a new user', async () => {
    const res = await request(app)
      .post('/register')
      .send({ username: 'alice', password: 'pw12345' });

    expect(res.status).toBe(201);
    expect(res.body.username).toBe('alice');
  });

  it('rejects a missing password', async () => {
    const res = await request(app)
      .post('/register')
      .send({ username: 'bob' });

    expect(res.status).toBe(400);
  });

  it('rejects a duplicate username', async () => {
    await request(app).post('/register').send({ username: 'carol', password: 'pw12345' });

    const res = await request(app)
      .post('/register')
      .send({ username: 'carol', password: 'pw12345' });

    expect(res.status).toBe(409);
  });
});

describe('POST /login', () => {
  beforeAll(async () => {
    await request(app).post('/register').send({ username: 'dave', password: 'pw12345' });
  });

  it('logs in with correct credentials and returns a token', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'dave', password: 'pw12345' });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });

  it('rejects the wrong password', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'dave', password: 'wrong' });

    expect(res.status).toBe(401);
  });

  it('rejects an unknown username', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'ghost', password: 'pw12345' });

    expect(res.status).toBe(401);
  });
});
