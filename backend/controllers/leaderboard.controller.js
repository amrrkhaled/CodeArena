const db = require('../config/db');

exports.getLeaderboard = async (req, res) => {
  const { contestId } = req.params;

  try {
    const blindTimeResult = await db.query(
      'SELECT blind_started_at FROM contests WHERE id = $1',
      [contestId]
    );

    const blindStartedAt = blindTimeResult.rows[0]?.blind_started_at || null;
    const leaderboardParams = blindStartedAt ? [contestId, blindStartedAt] : [contestId];
    const leaderboardFilter = blindStartedAt ? 'AND s.submitted_at < $2' : '';

    const { rows } = await db.query(
      `
      SELECT
        t.id AS team_id,
        t.name AS team_name,
        COUNT(DISTINCT s.problem_id) AS solved_count,
        COALESCE(SUM(
          CASE
            WHEN s.verdict = 'Accepted' THEN
              EXTRACT(EPOCH FROM s.submitted_at - c.start_time)/60 + (
                SELECT COUNT(*) * 20
                FROM submissions s2
                WHERE
                  s2.team_id = s.team_id AND
                  s2.problem_id = s.problem_id AND
                  s2.verdict != 'Accepted' AND
                  s2.submitted_at < s.submitted_at
              )
            ELSE 0
          END
        ), 0)::INT AS total_penalty
      FROM teams t
      JOIN submissions s ON s.team_id = t.id
      JOIN contests c ON c.id = s.contest_id
      WHERE s.verdict = 'Accepted'
        AND s.contest_id = $1
        ${leaderboardFilter}
      GROUP BY t.id, t.name
      ORDER BY solved_count DESC, total_penalty ASC;
      `,
      leaderboardParams
    );

    res.json(rows);
  } catch (err) {
    console.error('Leaderboard Error:', err);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
};

// Admin leaderboard (all teams with details)
exports.adminLeaderboard = async (req, res) => {
  try {
    const { rows } = await db.query(
      `
      WITH penalty_calc AS (
        SELECT
          s.team_id,
          s.problem_id,
          MIN(
            EXTRACT(EPOCH FROM s.submitted_at - c.start_time) / 60
            + (
              SELECT COUNT(*) * 20
              FROM submissions s2
              WHERE
                s2.team_id = s.team_id
                AND s2.problem_id = s.problem_id
                AND s2.verdict != 'Accepted'
                AND s2.submitted_at < s.submitted_at
            )
          ) AS penalty
        FROM submissions s
        JOIN contests c ON c.id = s.contest_id
        WHERE s.verdict = 'Accepted' AND c.id = $1
        GROUP BY s.team_id, s.problem_id
      )
      SELECT
        t.id AS team_id,
        t.name AS team_name,

        COUNT(DISTINCT s.problem_id) FILTER (WHERE s.verdict = 'Accepted') AS solved_count,
        COUNT(s.id) AS total_submissions,
        COUNT(s.id) FILTER (WHERE s.verdict != 'Accepted') AS wrong_submissions,

        COALESCE(ARRAY_AGG(DISTINCT p.id) FILTER (WHERE s.verdict = 'Accepted'), '{}') AS solved_problem_ids,
        COALESCE(ARRAY_AGG(DISTINCT p.title) FILTER (WHERE s.verdict = 'Accepted'), '{}') AS solved_problem_titles,
        COALESCE(ARRAY_AGG(DISTINCT p.id) FILTER (WHERE s.verdict != 'Accepted'), '{}') AS attempted_problem_ids,

        MAX(s.submitted_at) AS last_submission_time,

        COALESCE(SUM(pc.penalty), 0)::INT AS total_penalty,

        ROUND(
          COALESCE(SUM(pc.penalty), 0)::NUMERIC
          / NULLIF(COUNT(DISTINCT s.problem_id) FILTER (WHERE s.verdict = 'Accepted'), 0),
          2
        ) AS avg_penalty_per_solved

      FROM teams t
      LEFT JOIN submissions s ON s.team_id = t.id
      LEFT JOIN contests c ON c.id = s.contest_id
      LEFT JOIN problems p ON p.id = s.problem_id AND p.contest_id = c.id
      LEFT JOIN penalty_calc pc ON pc.team_id = t.id AND pc.problem_id = s.problem_id
      WHERE c.id = $1
      GROUP BY t.id, t.name
      ORDER BY solved_count DESC, total_penalty ASC;
      `,
      [req.params.contestId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Leaderboard Error:', err);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
};

// Admin leaderboard for a single team
exports.adminLeaderboardTeamByID = async (req, res) => {
  try {
    const { contestId, teamId } = req.params;

    const { rows } = await db.query(
      `
      WITH first_accepts AS (
        SELECT
          s.team_id,
          s.problem_id,
          MIN(s.submitted_at) AS first_accepted_at
        FROM submissions s
        WHERE s.verdict = 'Accepted'
          AND s.contest_id = $1
          AND s.team_id = $2
        GROUP BY s.team_id, s.problem_id
      ),
      penalty_per_problem AS (
        SELECT
          fa.team_id,
          fa.problem_id,
          (
            FLOOR(EXTRACT(EPOCH FROM (fa.first_accepted_at - c.start_time)) / 60)::INT
            + COALESCE(w.wrong_attempts, 0) * 20
          ) AS penalty
        FROM first_accepts fa
        JOIN contests c ON c.id = $1
        LEFT JOIN LATERAL (
          SELECT COUNT(*) AS wrong_attempts
          FROM submissions s2
          WHERE s2.team_id = fa.team_id
            AND s2.problem_id = fa.problem_id
            AND s2.contest_id = $1
            AND s2.submitted_at < fa.first_accepted_at
            AND s2.verdict != 'Accepted'
        ) w ON true
      ),
      penalty_sum AS (
        SELECT team_id, SUM(penalty) AS total_penalty
        FROM penalty_per_problem
        GROUP BY team_id
      )
      SELECT
        t.id AS team_id,
        t.name AS team_name,

        COALESCE(COUNT(DISTINCT fa.problem_id), 0) AS solved_count,
        COALESCE(COUNT(s.id), 0) AS total_submissions,
        COALESCE(COUNT(s.id) FILTER (WHERE s.verdict != 'Accepted'), 0) AS wrong_submissions,

        COALESCE(
          (
            SELECT JSON_AGG(
              JSONB_BUILD_OBJECT(
                'id', p.id,
                'title', p.title,
                'accepted_at', fa2.first_accepted_at,
                'wrong_attempts_before', (
                  SELECT COUNT(*) FROM submissions s3
                  WHERE s3.team_id = fa2.team_id
                    AND s3.problem_id = fa2.problem_id
                    AND s3.contest_id = $1
                    AND s3.submitted_at < fa2.first_accepted_at
                    AND s3.verdict != 'Accepted'
                )
              )
            )
            FROM first_accepts fa2
            JOIN problems p ON p.id = fa2.problem_id AND p.contest_id = $1
            WHERE fa2.team_id = t.id
          ),
          '[]'
        ) AS solved_problems,

        COALESCE(
          (
            SELECT JSON_AGG(JSONB_BUILD_OBJECT('id', p2.id, 'title', p2.title))
            FROM (
              SELECT DISTINCT s4.problem_id
              FROM submissions s4
              WHERE s4.contest_id = $1 AND s4.team_id = t.id
                AND s4.problem_id NOT IN (
                  SELECT problem_id FROM first_accepts fa3 WHERE fa3.team_id = t.id
                )
            ) q
            JOIN problems p2 ON p2.id = q.problem_id AND p2.contest_id = $1
          ),
          '[]'
        ) AS attempted_problems,

        COALESCE(
          (
            SELECT JSON_AGG(
              JSONB_BUILD_OBJECT(
                'id', s5.id,
                'problem_id', s5.problem_id,
                'verdict', s5.verdict,
                'submitted_at', s5.submitted_at
              )
              ORDER BY s5.submitted_at
            )
            FROM submissions s5
            WHERE s5.contest_id = $1 AND s5.team_id = t.id
          ),
          '[]'
        ) AS submissions,

        COALESCE(ps.total_penalty, 0)::INT AS total_penalty

      FROM teams t
      LEFT JOIN submissions s ON s.team_id = t.id AND s.contest_id = $1
      LEFT JOIN problems p ON p.id = s.problem_id AND p.contest_id = $1
      LEFT JOIN first_accepts fa ON fa.team_id = t.id AND fa.problem_id = p.id
      LEFT JOIN penalty_sum ps ON ps.team_id = t.id
      WHERE t.id = $2
      GROUP BY t.id, t.name, ps.total_penalty
      `,
      [contestId, teamId]
    );

    res.json(rows[0] || {});
  } catch (err) {
    console.error('Leaderboard Error:', err);
    res.status(500).json({ error: 'Failed to load team leaderboard' });
  }
};
