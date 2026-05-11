const db = require('../config/db');

const VALID_STATUSES = ['DRAFT', 'UPCOMING', 'ACTIVE', 'FROZEN', 'FINISHED'];

exports.getAllContests = async (_req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM contests
      ORDER BY
        CASE status
          WHEN 'ACTIVE'   THEN 5
          WHEN 'FROZEN'   THEN 4
          WHEN 'UPCOMING' THEN 3
          WHEN 'FINISHED' THEN 2
          WHEN 'DRAFT'    THEN 1
        END DESC,
        start_time DESC,
        id DESC
    `);
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
  const { name, start_time, end_time } = req.body;
  if (!name || !start_time || !end_time) {
    return res.status(400).json({ message: 'Name, start time, and end time are required' });
  }
  try {
    const result = await db.query(
      `INSERT INTO contests (name, start_time, end_time, status, blind_started_at)
       VALUES ($1, $2, $3, 'DRAFT', NULL) RETURNING *`,
      [name, start_time, end_time]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating contest:', error.message);
    res.status(500).json({ error: 'Failed to create contest' });
  }
};

exports.updateContest = async (req, res) => {
  const { id } = req.params;
  const { name, start_time, end_time } = req.body;

  if (!name || !start_time || !end_time) {
    return res.status(400).json({ message: 'Name, start time, and end time are required' });
  }

  try {
    const result = await db.query(
      `UPDATE contests SET name = $1, start_time = $2, end_time = $3 WHERE id = $4 RETURNING *`,
      [name, start_time, end_time, id]
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

// DRAFT → UPCOMING (makes contest visible to contestants)
exports.publishContest = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      `UPDATE contests SET status = 'UPCOMING' WHERE id = $1 AND status = 'DRAFT' RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(409).json({ message: 'Contest not found or not in DRAFT state' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error publishing contest:', error.message);
    res.status(500).json({ error: 'Failed to publish contest' });
  }
};

// UPCOMING → DRAFT (hides contest without deleting)
exports.unpublishContest = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      `UPDATE contests SET status = 'DRAFT' WHERE id = $1 AND status = 'UPCOMING' RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(409).json({ message: 'Contest not found or not in UPCOMING state' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error unpublishing contest:', error.message);
    res.status(500).json({ error: 'Failed to unpublish contest' });
  }
};

// ACTIVE → FROZEN (freezes the public leaderboard for the blind period)
exports.freezeContest = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      `UPDATE contests
       SET status = 'FROZEN', blind_started_at = NOW()
       WHERE id = $1 AND status = 'ACTIVE'
       RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(409).json({ message: 'Contest not found or not in ACTIVE state' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error freezing contest:', error.message);
    res.status(500).json({ error: 'Failed to freeze contest' });
  }
};

// ACTIVE / FROZEN → FINISHED (admin force-ends the contest early)
exports.finishContest = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      `UPDATE contests
       SET status = 'FINISHED'
       WHERE id = $1 AND status IN ('ACTIVE', 'FROZEN')
       RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(409).json({ message: 'Contest not found or not in ACTIVE/FROZEN state' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error finishing contest:', error.message);
    res.status(500).json({ error: 'Failed to finish contest' });
  }
};
