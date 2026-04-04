const db = require('../config/db');

exports.getAllContests = async (_req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM contests ORDER BY is_active DESC, start_time DESC, id DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching contests:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getContestById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM contests WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Contest not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching contest:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.createContest = async (req, res) => {
  const { name, start_time, end_time, is_active } = req.body;
  if (!name || !start_time || !end_time) {
    return res.status(400).json({ message: 'Name, start time, and end time are required' });
  }
  try {
    const result = await db.query(
      'INSERT INTO contests (name, start_time, end_time, is_active, blind_started_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, start_time, end_time, is_active || false, null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating contest:', error.message);
    res.status(500).json({ error: 'Failed to create contest' });
  }
};

exports.updateContest = async (req, res) => {
  const { id } = req.params;
  const { name, start_time, end_time, is_active, blind_started_at = null } = req.body;

  if (!name || !start_time || !end_time || typeof is_active !== 'boolean') {
    return res
      .status(400)
      .json({ message: 'Name, start time, end time, and active status are required' });
  }

  try {
    const result = await db.query(
      `UPDATE contests
       SET name = $1, start_time = $2, end_time = $3, is_active = $4, blind_started_at = $5
       WHERE id = $6
       RETURNING *`,
      [name, start_time, end_time, is_active, blind_started_at, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating contest:', error.message);
    res.status(500).json({ error: 'Failed to update contest' });
  }
};
