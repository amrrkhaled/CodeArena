process.env.JWT_SECRET = 'test_secret';

const db = require('../setup/mockDb');
const jwt = require('jsonwebtoken');
const { authenticateTeam, authenticateAdmin } = require('../../middleware/auth.middleware');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => jest.clearAllMocks());

describe('authenticateTeam', () => {
  it('returns 401 when no Authorization header', async () => {
    const res = mockRes();
    const next = jest.fn();
    await authenticateTeam({ headers: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 on invalid token', async () => {
    const res = mockRes();
    const next = jest.fn();
    await authenticateTeam({ headers: { authorization: 'Bearer badtoken' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when team not found in DB', async () => {
    const token = jwt.sign({ id: 99, name: 'Ghost' }, 'test_secret');
    db.query.mockResolvedValueOnce({ rowCount: 0 });
    const res = mockRes();
    const next = jest.fn();
    await authenticateTeam({ headers: { authorization: `Bearer ${token}` } }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next and sets req.user when token is valid', async () => {
    const token = jwt.sign({ id: 1, name: 'TeamA' }, 'test_secret');
    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, name: 'TeamA' }] });
    const res = mockRes();
    const next = jest.fn();
    const req = { headers: { authorization: `Bearer ${token}` } };
    await authenticateTeam(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject({ id: 1, name: 'TeamA' });
    expect(req.authType).toBe('team');
  });
});

describe('authenticateAdmin', () => {
  it('returns 401 when no Authorization header', async () => {
    const res = mockRes();
    const next = jest.fn();
    await authenticateAdmin({ headers: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('calls next and sets req.authType to admin', async () => {
    const token = jwt.sign({ id: 1, username: 'admin' }, 'test_secret');
    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, username: 'admin' }] });
    const res = mockRes();
    const next = jest.fn();
    const req = { headers: { authorization: `Bearer ${token}` } };
    await authenticateAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.authType).toBe('admin');
  });
});
