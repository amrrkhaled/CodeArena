const db = require('../setup/mockDb');
const contestController = require('../../controllers/contest.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => jest.clearAllMocks());

describe('getAllContests', () => {
  it('returns list of contests', async () => {
    const contests = [{ id: 1, name: 'Practice Contest' }];
    db.query.mockResolvedValueOnce({ rows: contests });
    const res = mockRes();
    await contestController.getAllContests({}, res);
    expect(res.json).toHaveBeenCalledWith(contests);
  });

  it('returns 500 on DB error', async () => {
    db.query.mockRejectedValueOnce(new Error('fail'));
    const res = mockRes();
    await contestController.getAllContests({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('getContestById', () => {
  it('returns contest when found', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Practice Contest' }] });
    const res = mockRes();
    await contestController.getContestById({ params: { id: '1' } }, res);
    expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'Practice Contest' });
  });

  it('returns 404 when not found', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = mockRes();
    await contestController.getContestById({ params: { id: '99' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('createContest', () => {
  it('returns 400 when required fields missing', async () => {
    const res = mockRes();
    await contestController.createContest({ body: { name: 'Test' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('creates contest and returns 201', async () => {
    const contest = { id: 1, name: 'Test', start_time: '2026-01-01', end_time: '2099-01-01' };
    db.query.mockResolvedValueOnce({ rows: [contest] });
    const res = mockRes();
    await contestController.createContest({
      body: { name: 'Test', start_time: '2026-01-01', end_time: '2099-01-01' }
    }, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(contest);
  });
});

describe('updateContest', () => {
  it('returns 400 when is_active missing or not boolean', async () => {
    const res = mockRes();
    await contestController.updateContest({
      params: { id: '1' },
      body: { name: 'Test', start_time: '2026-01-01', end_time: '2099-01-01' }
    }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when contest not found', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = mockRes();
    await contestController.updateContest({
      params: { id: '99' },
      body: { name: 'Test', start_time: '2026-01-01', end_time: '2099-01-01', is_active: true }
    }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('updates and returns contest', async () => {
    const updated = { id: 1, name: 'Updated', is_active: true };
    db.query.mockResolvedValueOnce({ rows: [updated] });
    const res = mockRes();
    await contestController.updateContest({
      params: { id: '1' },
      body: { name: 'Updated', start_time: '2026-01-01', end_time: '2099-01-01', is_active: true }
    }, res);
    expect(res.json).toHaveBeenCalledWith(updated);
  });
});
