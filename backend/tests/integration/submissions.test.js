process.env.JWT_SECRET = 'test_secret';

jest.mock('../../config/db', () => ({ query: jest.fn() }));
jest.mock('../../jobs/deactivateContests', () => {});
jest.mock('../../judge/judgeSubmission', () => ({ judgeSubmission: jest.fn() }));

const request = require('supertest');
const { createApp } = require('../../app');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');

const app = createApp();
const teamToken  = jwt.sign({ id: 1, name: 'TeamA' }, 'test_secret');
const adminToken = jwt.sign({ id: 1, username: 'admin' }, 'test_secret');

const mockTeamAuth  = () => db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, name: 'TeamA' }] });
const mockAdminAuth = () => db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, username: 'admin' }] });

beforeEach(() => jest.clearAllMocks());

describe('POST /api/submissions', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/submissions').send({});
    expect(res.status).toBe(401);
  });

  it('returns 400 when fields are missing', async () => {
    mockTeamAuth();
    const res = await request(app)
      .post('/api/submissions')
      .set('Authorization', `Bearer ${teamToken}`)
      .send({ problem_id: 'A' });
    expect(res.status).toBe(400);
  });

  it('creates submission and returns 201', async () => {
    mockTeamAuth();
    db.query.mockResolvedValueOnce({ rows: [{ id: 42 }] });
    const res = await request(app)
      .post('/api/submissions')
      .set('Authorization', `Bearer ${teamToken}`)
      .send({ contest_id: 1, problem_id: 'A', language_id: 1, code: 'int main(){}' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('submissionId', 42);
  });
});

describe('GET /api/submissions/mine', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/submissions/mine');
    expect(res.status).toBe(401);
  });

  it('returns submissions for the logged-in team', async () => {
    mockTeamAuth();
    const rows = [{ id: 1, problem_id: 'A', verdict: 'Accepted' }];
    db.query.mockResolvedValueOnce({ rows });
    const res = await request(app)
      .get('/api/submissions/mine')
      .set('Authorization', `Bearer ${teamToken}`)
      .query({ contest_id: 1 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(rows);
  });
});

describe('GET /api/submissions (admin)', () => {
  it('returns 401 for team token', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    const res = await request(app)
      .get('/api/submissions')
      .set('Authorization', `Bearer ${teamToken}`)
      .query({ contest_id: 1 });
    expect(res.status).toBe(401);
  });

  it('returns all submissions for admin', async () => {
    mockAdminAuth();
    const rows = [{ id: 1 }, { id: 2 }];
    db.query.mockResolvedValueOnce({ rows });
    const res = await request(app)
      .get('/api/submissions')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ contest_id: 1 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});
