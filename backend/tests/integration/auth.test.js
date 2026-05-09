process.env.JWT_SECRET = 'test_secret';

jest.mock('../../config/db', () => ({ query: jest.fn() }));
jest.mock('../../jobs/deactivateContests', () => {});

const request = require('supertest');
const { createApp } = require('../../app');
const bcrypt = require('bcrypt');
const db = require('../../config/db');

const app = createApp();

beforeEach(() => jest.clearAllMocks());

describe('POST /api/auth/register', () => {
  it('registers a new team and returns token', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'TeamA', password: 'pass123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'pass123' });
    expect(res.status).toBe(400);
  });

  it('returns 409 on duplicate team name', async () => {
    db.query.mockRejectedValueOnce({ code: '23505' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'TeamA', password: 'pass' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('returns token on valid login', async () => {
    const hash = await bcrypt.hash('pass123', 10);
    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, password: hash }] });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ name: 'TeamA', password: 'pass123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('returns 401 on wrong password', async () => {
    const hash = await bcrypt.hash('correct', 10);
    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, password: hash }] });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ name: 'TeamA', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('returns 401 when team not found', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ name: 'Ghost', password: 'x' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/admin/login', () => {
  it('returns token on valid admin login', async () => {
    const hash = await bcrypt.hash('admin', 10);
    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, password: hash }] });
    const res = await request(app)
      .post('/api/auth/admin/login')
      .send({ username: 'admin', password: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('returns 401 on wrong admin password', async () => {
    const hash = await bcrypt.hash('admin', 10);
    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, password: hash }] });
    const res = await request(app)
      .post('/api/auth/admin/login')
      .send({ username: 'admin', password: 'wrong' });
    expect(res.status).toBe(401);
  });
});
