/**
 * System tests — full user flows through the API.
 * Simulates: register → login → view problems → submit → check submissions → leaderboard
 */
process.env.JWT_SECRET = 'test_secret';

jest.mock('../../config/db', () => ({ query: jest.fn() }));
jest.mock('../../jobs/contestScheduler', () => {});
jest.mock('../../judge/judgeSubmission', () => ({ judgeSubmission: jest.fn() }));

const request = require('supertest');
const { createApp } = require('../../app');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');

const app = createApp();

beforeEach(() => jest.clearAllMocks());

// ─── Flow 1: Team registration and login ────────────────────────────────────
describe('System: Team Registration and Login Flow', () => {
  it('team can register and immediately use the returned token', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 10 }] });
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'AlphaTeam', password: 'secret', institution: 'FCI' });
    expect(regRes.status).toBe(201);
    const token = regRes.body.token;

    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 10, name: 'AlphaTeam' }] });
    db.query.mockResolvedValueOnce({ rows: [] });
    const subRes = await request(app)
      .get('/api/submissions/mine')
      .set('Authorization', `Bearer ${token}`)
      .query({ contest_id: 1 });
    expect(subRes.status).toBe(200);
  });

  it('team can login after registration', async () => {
    const hash = await bcrypt.hash('secret', 10);
    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 10, password: hash }] });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ name: 'AlphaTeam', password: 'secret' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});

// ─── Flow 2: Team solves a problem ──────────────────────────────────────────
describe('System: Problem Solving Flow', () => {
  const teamToken = jwt.sign({ id: 1, name: 'AlphaTeam' }, 'test_secret');

  it('team views contest problems and submits a solution', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 'A', contest_id: 1, title: 'Sum of Two Numbers' },
        { id: 'B', contest_id: 1, title: 'Palindrome Check' },
      ],
    });
    const problemsRes = await request(app).get('/api/problems/1');
    expect(problemsRes.status).toBe(200);
    expect(problemsRes.body).toHaveLength(2);

    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, name: 'AlphaTeam' }] });
    db.query.mockResolvedValueOnce({ rows: [{ status: 'ACTIVE' }] });
    db.query.mockResolvedValueOnce({ rows: [{ id: 99 }] });
    const submitRes = await request(app)
      .post('/api/submissions')
      .set('Authorization', `Bearer ${teamToken}`)
      .send({ contest_id: 1, problem_id: 'A', language_id: 1, code: 'int main(){int a,b;cin>>a>>b;cout<<a+b;}' });
    expect(submitRes.status).toBe(201);
    expect(submitRes.body.submissionId).toBe(99);
  });

  it('team checks their submission history', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, name: 'AlphaTeam' }] });
    db.query.mockResolvedValueOnce({
      rows: [{ id: 99, problem_id: 'A', title: 'Sum of Two Numbers', verdict: 'Accepted' }],
    });
    const res = await request(app)
      .get('/api/submissions/mine')
      .set('Authorization', `Bearer ${teamToken}`)
      .query({ contest_id: 1 });
    expect(res.status).toBe(200);
    expect(res.body[0].verdict).toBe('Accepted');
  });

  it('team checks solved count', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, name: 'AlphaTeam' }] });
    db.query.mockResolvedValueOnce({ rows: [{ solved_count: 1 }] });
    const res = await request(app)
      .get('/api/submissions/solved-count')
      .set('Authorization', `Bearer ${teamToken}`)
      .query({ contest_id: 1 });
    expect(res.status).toBe(200);
    expect(res.body.solvedCount).toBe(1);
  });
});

// ─── Flow 3: Admin manages a contest ────────────────────────────────────────
describe('System: Admin Contest Management Flow', () => {
  const adminToken = jwt.sign({ id: 1, username: 'admin' }, 'test_secret');

  it('admin logs in, creates a contest, and views leaderboard', async () => {
    const hash = await bcrypt.hash('admin', 10);
    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, password: hash }] });
    const loginRes = await request(app)
      .post('/api/auth/admin/login')
      .send({ username: 'admin', password: 'admin' });
    expect(loginRes.status).toBe(200);

    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, username: 'admin' }] });
    db.query.mockResolvedValueOnce({ rows: [{ id: 2, name: 'New Contest' }] });
    const createRes = await request(app)
      .post('/api/contests')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'New Contest', start_time: '2026-01-01', end_time: '2099-12-31' });
    expect(createRes.status).toBe(201);
    expect(createRes.body.name).toBe('New Contest');

    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, username: 'admin' }] });
    db.query.mockResolvedValueOnce({ rows: [{ team_id: 1, team_name: 'AlphaTeam', solved: 1 }] });
    const lbRes = await request(app)
      .get('/api/leaderboard/admin/2')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(lbRes.status).toBe(200);
  });
});

// ─── Flow 4: Security — unauthorized access ──────────────────────────────────
describe('System: Security — Unauthorized Access', () => {
  it('unauthenticated user cannot submit', async () => {
    const res = await request(app)
      .post('/api/submissions')
      .send({ contest_id: 1, problem_id: 'A', language_id: 1, code: 'x' });
    expect(res.status).toBe(401);
  });

  it('team cannot access admin endpoints', async () => {
    const teamToken = jwt.sign({ id: 1, name: 'TeamA' }, 'test_secret');
    db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    const res = await request(app)
      .post('/api/contests')
      .set('Authorization', `Bearer ${teamToken}`)
      .send({ name: 'Hack', start_time: '2026-01-01', end_time: '2099-01-01' });
    expect(res.status).toBe(401);
  });

  it('expired token is rejected', async () => {
    const expiredToken = jwt.sign({ id: 1, name: 'TeamA' }, 'test_secret', { expiresIn: '1ms' });
    await new Promise(r => setTimeout(r, 20));
    const res = await request(app)
      .get('/api/submissions/mine')
      .set('Authorization', `Bearer ${expiredToken}`)
      .query({ contest_id: 1 });
    expect(res.status).toBe(401);
  });

  it('tampered token is rejected', async () => {
    const res = await request(app)
      .get('/api/submissions/mine')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.fake.signature')
      .query({ contest_id: 1 });
    expect(res.status).toBe(401);
  });
});
