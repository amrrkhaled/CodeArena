process.env.JWT_SECRET = 'test_secret';

jest.mock('../../config/db', () => ({ query: jest.fn() }));
jest.mock('../../jobs/contestScheduler', () => {});

const request = require('supertest');
const { createApp } = require('../../app');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');

const app = createApp();

const adminToken = jwt.sign({ id: 1, username: 'admin' }, 'test_secret');
const teamToken  = jwt.sign({ id: 1, name: 'TeamA' }, 'test_secret');

const mockAdminAuth = () =>
  db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, username: 'admin' }] });
const mockTeamAuth = () =>
  db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, name: 'TeamA' }] });

beforeEach(() => jest.clearAllMocks());

describe('GET /api/contests', () => {
  it('returns list of contests', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Practice Contest' }] });
    const res = await request(app).get('/api/contests');
    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
  });
});

describe('GET /api/contests/:id', () => {
  it('returns contest by id', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Practice Contest' }] });
    const res = await request(app).get('/api/contests/1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
  });

  it('returns 404 for unknown contest', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/contests/999');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/contests', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/contests').send({});
    expect(res.status).toBe(401);
  });

  it('returns 400 when required fields missing', async () => {
    mockAdminAuth();
    const res = await request(app)
      .post('/api/contests')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test' });
    expect(res.status).toBe(400);
  });

  it('creates contest and returns 201', async () => {
    mockAdminAuth();
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test' }] });
    const res = await request(app)
      .post('/api/contests')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test', start_time: '2026-01-01', end_time: '2099-01-01' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('name', 'Test');
  });

  it('returns 401 when team tries to create contest', async () => {
    // admin middleware queries admins table — team ID not found there
    db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    const res = await request(app)
      .post('/api/contests')
      .set('Authorization', `Bearer ${teamToken}`)
      .send({ name: 'Test', start_time: '2026-01-01', end_time: '2099-01-01' });
    expect(res.status).toBe(401);
  });
});
