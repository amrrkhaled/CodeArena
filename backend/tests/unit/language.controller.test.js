const db = require('../setup/mockDb');
const { getLanguages } = require('../../controllers/language.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => jest.clearAllMocks());

describe('getLanguages', () => {
  it('returns all languages', async () => {
    const langs = [
      { id: 1, name: 'C++', extension: 'cpp' },
      { id: 2, name: 'Python', extension: 'py' },
      { id: 3, name: 'Java', extension: 'java' },
    ];
    db.query.mockResolvedValueOnce({ rows: langs });
    const res = mockRes();
    await getLanguages({}, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(langs);
  });

  it('returns 500 on DB error', async () => {
    db.query.mockRejectedValueOnce(new Error('DB error'));
    const res = mockRes();
    await getLanguages({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
