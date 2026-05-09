process.env.JWT_SECRET = 'test_secret';

const db = require('../setup/mockDb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authController = require('../../controllers/auth.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => jest.clearAllMocks());

// ── register ────────────────────────────────────────────────────────────────
describe('register', () => {
  it('returns 400 when name or password missing', async () => {
    const res = mockRes();
    await authController.register({ body: { name: '', password: '' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns token on successful registration', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const res = mockRes();
    await authController.register({ body: { name: 'TeamA', password: 'pass123' } }, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }));
  });

  it('returns 409 on duplicate team name', async () => {
    db.query.mockRejectedValueOnce({ code: '23505' });
    const res = mockRes();
    await authController.register({ body: { name: 'TeamA', password: 'pass' } }, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('returns 500 on unexpected DB error', async () => {
    db.query.mockRejectedValueOnce(new Error('DB down'));
    const res = mockRes();
    await authController.register({ body: { name: 'TeamA', password: 'pass' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── login ───────────────────────────────────────────────────────────────────
describe('login', () => {
  it('returns 400 when fields missing', async () => {
    const res = mockRes();
    await authController.login({ body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 when team not found', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    const res = mockRes();
    await authController.login({ body: { name: 'X', password: 'y' } }, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 on wrong password', async () => {
    const hash = await bcrypt.hash('correct', 10);
    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, password: hash }] });
    const res = mockRes();
    await authController.login({ body: { name: 'TeamA', password: 'wrong' } }, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns token on valid credentials', async () => {
    const hash = await bcrypt.hash('pass123', 10);
    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, password: hash }] });
    const res = mockRes();
    await authController.login({ body: { name: 'TeamA', password: 'pass123' } }, res);
    const call = res.json.mock.calls[0][0];
    expect(call).toHaveProperty('token');
    const decoded = jwt.verify(call.token, 'test_secret');
    expect(decoded.id).toBe(1);
  });
});

// ── AdminLogin ───────────────────────────────────────────────────────────────
describe('AdminLogin', () => {
  it('returns 400 when fields missing', async () => {
    const res = mockRes();
    await authController.AdminLogin({ body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 when admin not found', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    const res = mockRes();
    await authController.AdminLogin({ body: { username: 'admin', password: 'x' } }, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns token and sets cookie on valid login', async () => {
    const hash = await bcrypt.hash('admin', 10);
    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, password: hash }] });
    const res = mockRes();
    await authController.AdminLogin({ body: { username: 'admin', password: 'admin' } }, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }));
    expect(res.cookie).toHaveBeenCalledWith('adminToken', expect.any(String), expect.any(Object));
  });
});
