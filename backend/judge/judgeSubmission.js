const axios = require('axios');
const db = require('../config/db');
require('dotenv').config();
//submissions
const JUDGE0_URL = 'http://localhost:2358/submissions';
const JUDGE0_HEADERS = {
  'Content-Type': 'application/json',
};

// Local language_id → Judge0 language_id
const languageMap = {
  1: 54, // C++
  2: 71, // Python 3
  3: 62  // Java
};

exports.judgeSubmission = async function judgeSubmission(submissionId) {
  try {
    const { rows } = await db.query(
      `SELECT s.code, s.language_id, s.contest_id, s.problem_id
      FROM submissions s
      WHERE s.id = $1`,
      [submissionId]
    );

    if (rows.length === 0) {
      console.error('❌ Submission not found');
      return;
    }

    const sub = rows[0];

    const { rows: testCases } = await db.query(
      `SELECT input, expected_output FROM test_cases
      WHERE problem_id = $1 AND contest_id = $2
      ORDER BY is_sample DESC`,
      [sub.problem_id, sub.contest_id]
    );

    let maxTimeMs = 0;
    let maxMemoryKb = 0;

    for (const test of testCases) {
      // build payload
      const payload = {
        source_code: Buffer.from(sub.code).toString('base64'),
        language_id: languageMap[sub.language_id],
        stdin: Buffer.from(test.input || "").toString('base64'),
        expected_output: Buffer.from(test.expected_output || "").toString('base64')
      };

      // add compiler options only for C++
      if (languageMap[sub.language_id] === 54) {
        payload.compiler_options = "-std=gnu++17";
      }

      // send to Judge0
      const response = await axios.post(
        `${JUDGE0_URL}?base64_encoded=true&wait=true`,
        payload,
        { headers: JUDGE0_HEADERS }
      );

      const result = response.data;

      // Convert seconds to milliseconds
      const timeMs = Math.round((result.time || 0) * 1000);
      const memoryKb = result.memory || 0;

      maxTimeMs = Math.max(maxTimeMs, timeMs);
      maxMemoryKb = Math.max(maxMemoryKb, memoryKb);

      if (!result.status || !result.status.description) {
        console.error("⚠️ Unexpected Judge0 response:", result);
        await db.query(
          `UPDATE submissions SET verdict = 'Judge Error' WHERE id = $1`,
          [submissionId]
        );
        return;
      }

      if (result.status.description !== 'Accepted') {
        await db.query(
          `UPDATE submissions
          SET verdict = $1, execution_time_ms = $2, memory_used_kb = $3
          WHERE id = $4`,
          [result.status.description, timeMs, memoryKb, submissionId]
        );
        return;
      }
    }


    // All test cases passed
    await db.query(
      `UPDATE submissions
       SET verdict = 'Accepted', execution_time_ms = $1, memory_used_kb = $2
       WHERE id = $3`,
      [maxTimeMs, maxMemoryKb, submissionId]
    );

    console.log(`✅ Submission ${submissionId} Accepted`);

  } catch (err) {
    console.error("Judge0 Raw Error:", JSON.stringify(err.response?.data || err.message, null, 2));
    console.error('Judge API Error:', err.response?.data || err.message);
    await db.query(
      `UPDATE submissions SET verdict = 'Judge Error' WHERE id = $1`,
      [submissionId]
    );
  }
};
