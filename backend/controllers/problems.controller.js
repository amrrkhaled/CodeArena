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

  try {
    // multer stores file at req.file
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("Uploaded file info:", req.file); 

    // read and parse file
    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    const problems = JSON.parse(fileContent);

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

      // You may want default values if not in file
      const time_limit_ms = problem.time_limit_ms || 1000;
      const memory_limit_mb = problem.memory_limit_mb || 64;

      // Insert problem
      const result = await db.query(
        `INSERT INTO problems 
          (id, contest_id, title, description, input_description, output_description, sample_input, sample_output, time_limit_ms, memory_limit_mb)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (contest_id,id) DO UPDATE 
         SET title=EXCLUDED.title, description=EXCLUDED.description
         RETURNING *`,
        [id, contestId, title, description, input_description, output_description, sample_input, sample_output, time_limit_ms, memory_limit_mb]
      );

      // Insert test cases
      if (Array.isArray(test_cases)) {
        for (const tc of test_cases) {
          await db.query(
            `INSERT INTO test_cases (contest_id, problem_id, input, expected_output, is_sample)
             VALUES ($1,$2,$3,$4,$5)`,
            [contestId, id, tc.input, tc.output, tc.is_sample]
          );
        }
      }

      insertedProblems.push(result.rows[0]);
    }

    return res.status(201).json({
      message: "Problems and test cases uploaded successfully",
      problems: insertedProblems
    });

  } catch (error) {
    console.error("Error uploading problems:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
