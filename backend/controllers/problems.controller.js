const db = require('../config/db');

exports.getProblemById = async (req, res) => {
  const { contestId, id } = req.params;
  try {
    const result = await db.query(
      'SELECT * FROM problems WHERE contest_id = $1 AND id = $2',
      [contestId, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllProblemsForContest = async (req, res) => {
  const { contestId } = req.params;
  try {
    const result = await db.query(
      'SELECT * FROM problems WHERE contest_id = $1 ORDER BY id;',
      [contestId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllTestCasesForProblem = async (req, res) => {
  const {contestId , id} = req.params;

  try {
    const result = await db.query(
      'SELECT * FROM test_cases WHERE contest_id = $1 AND problem_id = $2',
      [contestId, id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
    
  }
}

const fs = require('fs');

exports.createProblem = async (req, res) => {
  const { contestId } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  let fileContent;
  try {
    fileContent = fs.readFileSync(req.file.path, 'utf-8');
  } catch {
    return res.status(400).json({ message: "Could not read uploaded file" });
  }

  let problems;
  try {
    problems = JSON.parse(fileContent);
  } catch {
    return res.status(400).json({ message: "Invalid JSON in uploaded file" });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const insertedProblems = [];

    for (const problem of problems) {
      const {
        id,
        title,
        description,
        input_description,
        output_description,
        sample_input,
        sample_output,
        test_cases
      } = problem;

      const time_limit_ms = problem.time_limit_ms || 1000;
      const memory_limit_mb = problem.memory_limit_mb || 64;

      const result = await client.query(
        `INSERT INTO problems
          (id, contest_id, title, description, input_description, output_description, sample_input, sample_output, time_limit_ms, memory_limit_mb)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (contest_id,id) DO UPDATE
         SET title=EXCLUDED.title, description=EXCLUDED.description
         RETURNING *`,
        [id, contestId, title, description, input_description, output_description, sample_input, sample_output, time_limit_ms, memory_limit_mb]
      );

      if (Array.isArray(test_cases)) {
        for (const tc of test_cases) {
          await client.query(
            `INSERT INTO test_cases (contest_id, problem_id, input, expected_output, is_sample)
             VALUES ($1,$2,$3,$4,$5)`,
            [contestId, id, tc.input, tc.output, tc.is_sample]
          );
        }
      }

      insertedProblems.push(result.rows[0]);
    }

    await client.query('COMMIT');

    return res.status(201).json({
      message: "Problems and test cases uploaded successfully",
      problems: insertedProblems
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error uploading problems:", error);
    return res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};
