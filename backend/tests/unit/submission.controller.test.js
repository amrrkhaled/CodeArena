const db = require('../setup/mockDb');
jest.mock('../../judge/judgeSubmission', () => ({ judgeSubmission: jest.fn() }));

const submissionController = require('../../controllers/submission.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => jest.clearAllMocks());

describe('submit', () => {
  it('returns 400 when fields are missing', async () => {
    const res = mockRes();
    await submissionController.submit({ body: {}, user: { id: 1 } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('creates submission and returns 201', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 42 }] });
    const res = mockRes();
    await submissionController.submit({
      body: { contest_id: 1, problem_id: 'A', language_id: 1, code: 'print(1)' },
      user: { id: 1 }
    }, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ submissionId: 42 }));
  });

  it('returns 500 on DB error', async () => {
    db.query.mockRejectedValueOnce(new Error('DB fail'));
    const res = mockRes();
    await submissionController.submit({
      body: { contest_id: 1, problem_id: 'A', language_id: 1, code: 'code' },
      user: { id: 1 }
    }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('getMySubmissions', () => {
  it('returns submissions for current team', async () => {
    const rows = [{ id: 1, problem_id: 'A', verdict: 'Accepted' }];
    db.query.mockResolvedValueOnce({ rows });
    const res = mockRes();
    await submissionController.getMySubmissions({
      user: { id: 1 }, query: { contest_id: 1 }
    }, res);
    expect(res.json).toHaveBeenCalledWith(rows);
  });
});

describe('getSolvedCount', () => {
  it('returns solved count', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ solved_count: '3' }] });
    const res = mockRes();
    await submissionController.getSolvedCount({
      user: { id: 1 }, query: { contest_id: 1 }
    }, res);
    expect(res.json).toHaveBeenCalledWith({ solvedCount: '3' });
  });
});
