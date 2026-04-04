const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;

async function authenticateEntity(req, res, next, entity) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    let result;
    if (entity === 'team') {
      result = await db.query('SELECT id, name FROM teams WHERE id = $1', [payload.id]);
    } else {
      result = await db.query('SELECT id, username FROM admins WHERE id = $1', [payload.id]);
    }

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = payload;
    req.authType = entity;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function authenticateTeam(req, res, next) {
  return authenticateEntity(req, res, next, 'team');
}

function authenticateAdmin(req, res, next) {
  return authenticateEntity(req, res, next, 'admin');
}

module.exports = {
  authenticateTeam,
  authenticateAdmin,
};
