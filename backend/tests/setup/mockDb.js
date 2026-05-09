jest.mock('../../config/db', () => ({ query: jest.fn() }));
const db = require('../../config/db');
module.exports = db;
