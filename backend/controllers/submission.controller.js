const db = require('../config/db');
const { judgeSubmission } = require('../judge/judgeSubmission');

// Submit a new solution
exports.submit = async (req, res) => {
  const { contest_id, problem_id, language_id, code } = req.body;
  const team_id = req.user.id;

  if (!contest_id || !problem_id || !language_id || !code) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const result = await db.query(
      `INSERT INTO submissions (team_id, contest_id, problem_id, language_id, code, verdict)
       VALUES ($1, $2, $3, $4, $5, 'Pending') RETURNING id`,
      [team_id, contest_id, problem_id, language_id, code]
    );

    const submissionId = result.rows[0].id;

    judgeSubmission(submissionId);

    res.status(201).json({ message: 'Submission received', submissionId });
  } catch (err) {
    console.error('Error inserting submission:', err.message);
    res.status(500).json({ error: 'Submission failed' });
  }
};

// Get all submissions of the current team
exports.getMySubmissions = async (req, res) => {
  const teamId = req.user.id;
  const contestId = req.query.contest_id;

  try {
    const { rows } = await db.query(
      `SELECT s.id, s.problem_id, s.contest_id, p.title, s.verdict, s.submitted_at
       FROM submissions s
       JOIN problems p 
         ON p.id = s.problem_id 
        AND p.contest_id = s.contest_id 
        AND p.contest_id = $2
       WHERE s.team_id = $1
       ORDER BY s.submitted_at DESC`,
      [teamId, contestId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error fetching submissions:', err.message);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

// Get one submission by ID (only if owned by current team)
exports.getSubmissionById = async (req, res) => {
  const teamId = req.user.id;
  const submissionId = req.params.id;

  try {
    const { rows } = await db.query(
      `SELECT s.id, s.problem_id, s.contest_id, p.title, 
              s.verdict, s.code, s.submitted_at, s.execution_time_ms
       FROM submissions s
       JOIN problems p ON s.problem_id = p.id AND s.contest_id = p.contest_id
       WHERE s.id = $1 AND s.team_id = $2`,
      [submissionId, teamId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching submission:', err.message);
    res.status(500).json({ error: 'Could not fetch submission' });
  }
};

// Get count of solved problems (Accepted verdict) counting distinct contest-problem pairs
exports.getSolvedCount = async (req, res) => {
  const contestId = req.query.contest_id;
  const teamId = req.user.id;

  try {
    const { rows } = await db.query(
      `SELECT COUNT(DISTINCT (contest_id, problem_id)) AS solved_count
       FROM submissions
       WHERE team_id = $1 AND contest_id = $2 AND verdict = 'Accepted'`,
      [teamId, contestId]
    );

    // If no solved problems, return 0 safely
    res.json({ solvedCount: rows[0]?.solved_count || 0 });
  } catch (err) {
    console.error('Error fetching solved problems count:', err.message);
    res.status(500).json({ error: 'Could not fetch solved count' });
  }
};

//get all submissions of all teams
exports.getAllSubmissions = async (req, res) => {
  const contestId = req.query.contest_id;

  try {
    const { rows } = await db.query(
      `SELECT s.id, s.problem_id, s.contest_id, p.title, 
              s.verdict, s.code, s.submitted_at, s.execution_time_ms, t.name AS team_name
       FROM submissions s
       JOIN problems p ON s.problem_id = p.id AND s.contest_id = p.contest_id
       JOIN teams t ON s.team_id = t.id
       WHERE s.contest_id = $1
       ORDER BY s.submitted_at DESC`,
      [contestId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching all submissions:', error.message);
    res.status(500).json({ error: 'Could not fetch submissions' });
  }
}

//get submission by id
exports.getSubmissionByIdPublic = async (req, res) => {
  const submissionId = req.params.id;

  try {
    const { rows } = await db.query(
      `SELECT s.id, s.problem_id, s.contest_id, p.title, 
              s.verdict, s.code, s.submitted_at, s.execution_time_ms
       FROM submissions s
       JOIN problems p ON s.problem_id = p.id AND s.contest_id = p.contest_id
       WHERE s.id = $1`,
      [submissionId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching submission:', err.message);
    res.status(500).json({ error: 'Could not fetch submission' });
  }
}