require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const readline = require('readline');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const baseURL = 'http://localhost:5000/api';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function generatePassword(length = 8) {
  // Generate URL-safe base64, slice to length, remove special chars
  return crypto.randomBytes(length)
    .toString('base64')
    .replace(/[+/=]/g, '')
    .slice(0, length);
}

async function insertTeamsAndSaveToFile() {
  console.log('\nEnter team names (one per line). Press ENTER on empty line to finish.');

  const teams = [];

  while (true) {
    const name = await ask('Team name: ');
    if (!name.trim()) break;

    const institution = await ask('Institution (optional): ');
    const password = generatePassword();

    try {
      await axios.post(`${baseURL}/auth/register`, {
        name: name.trim(),
        institution: institution || null,
        password
      });

      console.log(`✅ Registered team '${name.trim()}' with password: ${password}`);
      teams.push({ name: name.trim(), password });
    } catch (err) {
      if (err.response?.status === 409) {
        console.error(`❌ Team '${name.trim()}' already exists! Skipping.`);
      } else {
        console.error(`❌ Error registering team '${name.trim()}':`, err.response?.data || err.message);
      }
    }
  }

  if (teams.length) {
    const filePath = path.join(__dirname, 'teams_passwords.txt');
    const data = teams.map(t => `${t.name},${t.password}`).join('\n');
    fs.writeFileSync(filePath, data);
    console.log(`\n📁 Saved teams and passwords to file: ${filePath}\n`);
  } else {
    console.log('No teams entered, nothing saved.');
  }
}
async function createContest() {
  console.log('\n🆕 Create a new contest');

  const name = await ask('Contest name: ');
  const start_time = await ask('Start time (YYYY-MM-DD HH:mm:ss): ');
  const end_time = await ask('End time (YYYY-MM-DD HH:mm:ss): ');
  const is_active_input = await ask('Is active? (yes/no, default yes): ');
  const is_active = !is_active_input || is_active_input.toLowerCase().startsWith('y');

  try {
    const res = await pool.query(
      `INSERT INTO contests (name, start_time, end_time, is_active)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [name, start_time, end_time, is_active]
    );
    const contestId = res.rows[0].id;
    console.log(`✅ Created contest with ID: ${contestId}\n`);
    return contestId;
  } catch (err) {
    console.error('❌ Error creating contest:', err.message);
    return null;
  }
}

async function insertProblemsAndTestCases(contestId) {
  console.log('\n🧩 Enter problem details for contest ID', contestId);
  console.log('Press ENTER on problem ID to finish problems entry.\n');

  while (true) {
    const id = await ask('Problem ID (e.g. A): ');
    if (!id.trim()) break;

    const title = await ask('Title: ');
    const description = await ask('Description: ');
    const input_description = await ask('Input Description: ');
    const output_description = await ask('Output Description: ');
    const sample_input = await ask('Sample Input: ');
    const sample_output = await ask('Sample Output: ');
    // Defaults
    const time_limit_ms = 1000;
    const memory_limit_mb = 64;

    try {
      await pool.query(
        `INSERT INTO problems (
          id, contest_id, title, description,
          input_description, output_description,
          sample_input, sample_output,
          time_limit_ms, memory_limit_mb
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          id.trim(),
          contestId,
          title,
          description,
          input_description,
          output_description,
          sample_input,
          sample_output,
          time_limit_ms,
          memory_limit_mb,
        ]
      );
      console.log(`✅ Inserted problem '${id.trim()}'`);
    } catch (err) {
      console.error(`❌ Error inserting problem '${id.trim()}':`, err.message);
      continue; // skip to next problem
    }

    console.log('Enter test cases for this problem. Press ENTER on input to stop.\n');

    while (true) {
      const input = await ask('Test case input: ');
      if (!input.trim()) break;
      const expected_output = await ask('Expected output: ');
      const is_sample_input = await ask('Is sample test case? (yes/no): ');
      const is_sample = is_sample_input.toLowerCase().startsWith('y');

      try {
        await pool.query(
          `INSERT INTO test_cases (contest_id, problem_id, input, expected_output, is_sample)
           VALUES ($1, $2, $3, $4, $5)`,
          [contestId, id.trim(), input, expected_output, is_sample]
        );
        console.log(`✅ Inserted test case`);
      } catch (err) {
        console.error(`❌ Error inserting test case:`, err.message);
      }
    }
  }
}

async function main() {
  try {
    console.log('==== Team Creation ====');
    await insertTeamsAndSaveToFile();

    console.log('\n==== Contest Setup ====');
    const choice = await ask('Do you want to (1) create a new contest or (2) use existing contest? Enter 1 or 2: ');

    let contestId;

    if (choice.trim() === '1') {
      contestId = await createContest();
      if (!contestId) {
        console.error('Failed to create contest. Exiting.');
        rl.close();
        await pool.end();
        return;
      }
    } else if (choice.trim() === '2') {
      const contestIdInput = await ask('Enter existing contest ID: ');
      contestId = parseInt(contestIdInput.trim());
      if (isNaN(contestId)) {
        console.error('❌ Invalid contest ID.');
        rl.close();
        await pool.end();
        return;
      }
    } else {
      console.error('Invalid choice. Exiting.');
      rl.close();
      await pool.end();
      return;
    }

    await insertProblemsAndTestCases(contestId);

    console.log('\n🎉 All done! Exiting...');
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  } finally {
    rl.close();
    await pool.end();
  }
}


main();
