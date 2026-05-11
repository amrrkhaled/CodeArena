process.env.JWT_SECRET = 'test_secret';

jest.mock('../../config/db', () => ({ query: jest.fn() }));
jest.mock('../../jobs/contestScheduler', () => {});

const request = require('supertest');
const { createApp } = require('../../app');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');

const app = createApp();
const adminToken = jwt.sign({ id: 1, username: 'admin' }, 'test_secret');

const mockAdminAuth = () =>
  db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, username: 'admin' }] });

beforeEach(() => jest.clearAllMocks());

describe('GET /api/leaderboard/:contestId', () => {
  it('returns public leaderboard', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ blind_started_at: null }] })
      .mockResolvedValueOnce({ rows: [{ team_id: 1, team_name: 'TeamA', solved: 2, penalty: 100 }] });
    const res = await request(app).get('/api/leaderboard/1');
    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
  });

  it('returns empty array when contest not found', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })       // blind_started_at query — no contest
      .mockResolvedValueOnce({ rows: [] });       // leaderboard query
    const res = await request(app).get('/api/leaderboard/999');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /api/leaderboard/admin/:contestId', () => {
  it('returns 401 without admin token', async () => {
    const res = await request(app).get('/api/leaderboard/admin/1');
    expect(res.status).toBe(401);
  });

  it('returns admin leaderboard with valid token', async () => {
    mockAdminAuth();
    db.query.mockResolvedValueOnce({ rows: [{ team_id: 1, team_name: 'TeamA', solved: 3 }] });
    const res = await request(app)
      .get('/api/leaderboard/admin/1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});
