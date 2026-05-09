const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
console.log('🌱 Seeding DB at:', process.env.DATABASE_URL);

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create tables if they don't exist
    console.log('🏗️  Running schema...');
    const schema = fs.readFileSync(path.resolve(__dirname, '../sql/tables.sql'), 'utf-8');
    await client.query(schema);
    console.log('✅ Schema ready.');

    console.log('🧹 Clearing all tables...');
    await client.query(`
      TRUNCATE TABLE submissions, test_cases, problems, teams, languages, contests, admins
      RESTART IDENTITY CASCADE
    `);
    console.log('✅ Cleared.');

    // Contest
    const { rows: [{ id: contestId }] } = await client.query(
      `INSERT INTO contests (name, start_time, end_time, is_active)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Practice Contest', '2026-01-01 00:00:00', '2099-12-31 23:59:59', true]
    );
    console.log(`🏁 Contest inserted (ID: ${contestId})`);

    // Problems + test cases
    const problems = [
      {
        id: 'A',
        title: 'Sum of Two Numbers',
        description: 'Given two integers, output their sum.',
        input_description: 'Two integers a and b.',
        output_description: 'One integer: the sum of a and b.',
        sample_input: '3 5',
        sample_output: '8',
        test_cases: [
          { input: '2 7',       output: '9',       is_sample: true  },
          { input: '-3 -4',     output: '-7',      is_sample: true  },
          { input: '100 200',   output: '300',     is_sample: true  },
          { input: '10 20',     output: '30',      is_sample: false },
          { input: '-5 5',      output: '0',       is_sample: false },
          { input: '123 456',   output: '579',     is_sample: false },
          { input: '1000 -500', output: '500',     is_sample: false },
          { input: '999999 1',  output: '1000000', is_sample: false },
          { input: '-1000 -2000', output: '-3000', is_sample: false },
          { input: '0 0',       output: '0',       is_sample: false },
        ],
      },
      {
        id: 'B',
        title: 'Palindrome Check',
        description: 'Check if a given string is a palindrome.',
        input_description: 'A single string of lowercase letters.',
        output_description: 'Output YES if it is a palindrome, otherwise NO.',
        sample_input: 'abba',
        sample_output: 'YES',
        test_cases: [
          { input: 'madam',     output: 'YES', is_sample: true  },
          { input: 'abcba',     output: 'YES', is_sample: true  },
          { input: 'world',     output: 'NO',  is_sample: true  },
          { input: 'hello',     output: 'NO',  is_sample: false },
          { input: 'racecar',   output: 'YES', is_sample: false },
          { input: 'a',         output: 'YES', is_sample: false },
          { input: 'xyzzyx',    output: 'YES', is_sample: false },
          { input: 'openai',    output: 'NO',  is_sample: false },
          { input: 'noon',      output: 'YES', is_sample: false },
          { input: 'palindrome',output: 'NO',  is_sample: false },
        ],
      },
      {
        id: 'C',
        title: 'Maximum in Array',
        description: 'Return the maximum element in the array.',
        input_description: 'First line n, then n integers.',
        output_description: 'The maximum number.',
        sample_input: '5\n1 8 2 4 9',
        sample_output: '9',
        test_cases: [
          { input: '4\n-1 -2 -3 -4',              output: '-1',  is_sample: true  },
          { input: '6\n10 20 30 40 50 60',         output: '60',  is_sample: true  },
          { input: '3\n100 100 99',                output: '100', is_sample: true  },
          { input: '3\n-1 -10 -5',                 output: '-1',  is_sample: false },
          { input: '4\n10 20 30 5',                output: '30',  is_sample: false },
          { input: '7\n5 5 5 5 5 5 5',             output: '5',   is_sample: false },
          { input: '8\n1 2 3 4 5 6 7 8',           output: '8',   is_sample: false },
          { input: '5\n-10 -20 -30 -40 -5',        output: '-5',  is_sample: false },
          { input: '10\n100 90 80 70 60 50 40 30 20 10', output: '100', is_sample: false },
        ],
      },
    ];

    for (const prob of problems) {
      await client.query(
        `INSERT INTO problems
          (id, contest_id, title, description, input_description, output_description,
           sample_input, sample_output, time_limit_ms, memory_limit_mb)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [prob.id, contestId, prob.title, prob.description,
         prob.input_description, prob.output_description,
         prob.sample_input, prob.sample_output, 1000, 64]
      );
      for (const tc of prob.test_cases) {
        await client.query(
          `INSERT INTO test_cases (contest_id, problem_id, input, expected_output, is_sample)
           VALUES ($1,$2,$3,$4,$5)`,
          [contestId, prob.id, tc.input, tc.output, tc.is_sample]
        );
      }
    }
    console.log(`📝 Inserted ${problems.length} problems with test cases`);

    // Languages
    await client.query(`
      INSERT INTO languages (id, name, extension) VALUES
      (1, 'C++',    'cpp'),
      (2, 'Python', 'py'),
      (3, 'Java',   'java')
    `);
    console.log('🌐 Inserted languages');

    // Admin
    const hashedPassword = await bcrypt.hash('admin', 10);
    await client.query(
      `INSERT INTO admins (username, password, email, role) VALUES ($1,$2,$3,$4)`,
      ['admin', hashedPassword, 'admin@codearena.com', 'admin']
    );
    console.log('👤 Inserted admin: admin / admin');

    await client.query('COMMIT');
    console.log('✅ Seed complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed error:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    pool.end();
  }
}

seed();
