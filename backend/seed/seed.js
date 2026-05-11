const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
console.log('🌱 Seeding DB at:', process.env.DATABASE_URL);

// Realistic code snippets per problem/language
const CODE = {
  A_cpp_ac:  '#include<bits/stdc++.h>\nusing namespace std;\nint main(){int a,b;cin>>a>>b;cout<<a+b;}',
  A_cpp_wa:  '#include<bits/stdc++.h>\nusing namespace std;\nint main(){int a,b;cin>>a>>b;cout<<a-b;}',
  A_py_ac:   'a,b=map(int,input().split())\nprint(a+b)',
  B_cpp_ac:  '#include<bits/stdc++.h>\nusing namespace std;\nint main(){string s;cin>>s;string r(s.rbegin(),s.rend());cout<<(s==r?"YES":"NO");}',
  B_cpp_wa:  '#include<bits/stdc++.h>\nusing namespace std;\nint main(){string s;cin>>s;cout<<"YES";}',
  B_py_ac:   's=input()\nprint("YES"if s==s[::-1]else"NO")',
  C_cpp_ac:  '#include<bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;vector<int>a(n);for(auto&x:a)cin>>x;cout<<*max_element(a.begin(),a.end());}',
  C_cpp_tle: '#include<bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;vector<int>a(n);for(auto&x:a)cin>>x;int m=a[0];for(int i=0;i<n;i++)for(int j=0;j<n;j++)if(a[j]>m)m=a[j];cout<<m;}',
  C_py_ac:   'n=int(input())\nprint(max(map(int,input().split())))',
};

// ts(minutesOffset) — timestamp relative to contest start
function ts(minutes) {
  const base = new Date('2026-01-01T00:00:00Z');
  base.setMinutes(base.getMinutes() + minutes);
  return base.toISOString();
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Schema ────────────────────────────────────────────────────────────────
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

    // ── Contest ───────────────────────────────────────────────────────────────
    const { rows: [{ id: contestId }] } = await client.query(
      `INSERT INTO contests (name, start_time, end_time, status)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Practice Contest', '2026-01-01 00:00:00', '2099-12-31 23:59:59', 'ACTIVE']
    );
    console.log(`🏁 Contest inserted (ID: ${contestId})`);

    // ── Problems + test cases ─────────────────────────────────────────────────
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
          { input: '2 7',         output: '9',       is_sample: true  },
          { input: '-3 -4',       output: '-7',      is_sample: true  },
          { input: '100 200',     output: '300',     is_sample: true  },
          { input: '10 20',       output: '30',      is_sample: false },
          { input: '-5 5',        output: '0',       is_sample: false },
          { input: '123 456',     output: '579',     is_sample: false },
          { input: '1000 -500',   output: '500',     is_sample: false },
          { input: '999999 1',    output: '1000000', is_sample: false },
          { input: '-1000 -2000', output: '-3000',   is_sample: false },
          { input: '0 0',         output: '0',       is_sample: false },
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
          { input: 'madam',      output: 'YES', is_sample: true  },
          { input: 'abcba',      output: 'YES', is_sample: true  },
          { input: 'world',      output: 'NO',  is_sample: true  },
          { input: 'hello',      output: 'NO',  is_sample: false },
          { input: 'racecar',    output: 'YES', is_sample: false },
          { input: 'a',          output: 'YES', is_sample: false },
          { input: 'xyzzyx',     output: 'YES', is_sample: false },
          { input: 'openai',     output: 'NO',  is_sample: false },
          { input: 'noon',       output: 'YES', is_sample: false },
          { input: 'palindrome', output: 'NO',  is_sample: false },
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
          { input: '4\n-1 -2 -3 -4',                   output: '-1',  is_sample: true  },
          { input: '6\n10 20 30 40 50 60',              output: '60',  is_sample: true  },
          { input: '3\n100 100 99',                     output: '100', is_sample: true  },
          { input: '3\n-1 -10 -5',                      output: '-1',  is_sample: false },
          { input: '4\n10 20 30 5',                     output: '30',  is_sample: false },
          { input: '7\n5 5 5 5 5 5 5',                  output: '5',   is_sample: false },
          { input: '8\n1 2 3 4 5 6 7 8',                output: '8',   is_sample: false },
          { input: '5\n-10 -20 -30 -40 -5',             output: '-5',  is_sample: false },
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

    // ── Languages ─────────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO languages (id, name, extension) VALUES
      (1, 'C++',    'cpp'),
      (2, 'Python', 'py'),
      (3, 'Java',   'java')
    `);
    console.log('🌐 Inserted languages');

    // ── Admin ─────────────────────────────────────────────────────────────────
    const hashedAdmin = await bcrypt.hash('admin', 10);
    await client.query(
      `INSERT INTO admins (username, password, email, role) VALUES ($1,$2,$3,$4)`,
      ['admin', hashedAdmin, 'admin@codearena.com', 'admin']
    );
    console.log('👤 Inserted admin: admin / admin');

    // ── Teams ─────────────────────────────────────────────────────────────────
    const teamsData = [
      { name: 'CodeCrusaders', institution: 'FCI', password: 'pass123' },
      { name: 'BinaryBeasts',  institution: 'FCI', password: 'pass123' },
      { name: 'AlgoAces',      institution: 'FCI', password: 'pass123' },
      { name: 'NullPointers',  institution: 'FCI', password: 'pass123' },
      { name: 'RuntimeError',  institution: 'FCI', password: 'pass123' },
      { name: 'SegFault',      institution: 'FCI', password: 'pass123' },
      { name: 'InfiniteLoop',  institution: 'FCI', password: 'pass123' },
      { name: 'HelloWorld',    institution: 'FCI', password: 'pass123' },
    ];

    const teamIds = {};
    for (const t of teamsData) {
      const hash = await bcrypt.hash(t.password, 10);
      const { rows: [{ id }] } = await client.query(
        `INSERT INTO teams (name, password, institution) VALUES ($1,$2,$3) RETURNING id`,
        [t.name, hash, t.institution]
      );
      teamIds[t.name] = id;
    }
    console.log(`👥 Inserted ${teamsData.length} teams (all password: pass123)`);

    // ── Submissions ───────────────────────────────────────────────────────────
    // Format: [teamName, problemId, languageId, verdict, executionMs, code, minutesOffset]
    const subs = [
      // CodeCrusaders — solves all 3, clean runs
      ['CodeCrusaders', 'A', 1, 'Accepted',      45,  CODE.A_cpp_ac,  5  ],
      ['CodeCrusaders', 'B', 1, 'Accepted',      62,  CODE.B_cpp_ac,  18 ],
      ['CodeCrusaders', 'C', 1, 'Accepted',      80,  CODE.C_cpp_ac,  35 ],

      // BinaryBeasts — solves A and B, one WA on B before AC, doesn't finish C
      ['BinaryBeasts',  'A', 2, 'Accepted',      55,  CODE.A_py_ac,   8  ],
      ['BinaryBeasts',  'B', 1, 'Wrong Answer',  40,  CODE.B_cpp_wa,  22 ],
      ['BinaryBeasts',  'B', 1, 'Accepted',      58,  CODE.B_cpp_ac,  30 ],
      ['BinaryBeasts',  'C', 1, 'Time Limit Exceeded', 1000, CODE.C_cpp_tle, 55 ],

      // AlgoAces — solves A and C, struggles with B
      ['AlgoAces',      'A', 1, 'Accepted',      48,  CODE.A_cpp_ac,  12 ],
      ['AlgoAces',      'B', 1, 'Wrong Answer',  35,  CODE.B_cpp_wa,  25 ],
      ['AlgoAces',      'B', 1, 'Wrong Answer',  38,  CODE.B_cpp_wa,  40 ],
      ['AlgoAces',      'C', 2, 'Accepted',      90,  CODE.C_py_ac,   50 ],

      // NullPointers — solves only A, two WA on B
      ['NullPointers',  'A', 1, 'Accepted',      52,  CODE.A_cpp_ac,  15 ],
      ['NullPointers',  'B', 1, 'Wrong Answer',  44,  CODE.B_cpp_wa,  35 ],
      ['NullPointers',  'B', 1, 'Wrong Answer',  41,  CODE.B_cpp_wa,  60 ],

      // RuntimeError — solves A, one WA on A first, then solves B
      ['RuntimeError',  'A', 1, 'Wrong Answer',  30,  CODE.A_cpp_wa,  10 ],
      ['RuntimeError',  'A', 1, 'Accepted',      50,  CODE.A_cpp_ac,  20 ],
      ['RuntimeError',  'B', 2, 'Accepted',      70,  CODE.B_py_ac,   45 ],

      // SegFault — only WA/TLE, nothing solved
      ['SegFault',      'A', 1, 'Wrong Answer',  28,  CODE.A_cpp_wa,  20 ],
      ['SegFault',      'B', 1, 'Wrong Answer',  33,  CODE.B_cpp_wa,  40 ],
      ['SegFault',      'C', 1, 'Time Limit Exceeded', 1000, CODE.C_cpp_tle, 65 ],

      // InfiniteLoop — TLE on C, WA on others
      ['InfiniteLoop',  'A', 1, 'Wrong Answer',  25,  CODE.A_cpp_wa,  30 ],
      ['InfiniteLoop',  'C', 1, 'Time Limit Exceeded', 1000, CODE.C_cpp_tle, 50 ],

      // HelloWorld — solves only A
      ['HelloWorld',    'A', 2, 'Accepted',      60,  CODE.A_py_ac,   25 ],
      ['HelloWorld',    'B', 1, 'Wrong Answer',  38,  CODE.B_cpp_wa,  55 ],
    ];

    for (const [team, prob, lang, verdict, execMs, code, mins] of subs) {
      await client.query(
        `INSERT INTO submissions
          (team_id, contest_id, problem_id, language_id, verdict, execution_time_ms, code, submitted_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [teamIds[team], contestId, prob, lang, verdict, execMs, code, ts(mins)]
      );
    }
    console.log(`📨 Inserted ${subs.length} submissions`);

    await client.query('COMMIT');
    console.log('\n✅ Seed complete.');
    console.log('   Contest: Practice Contest (ACTIVE, ID 1)');
    console.log('   Admin:   admin / admin');
    console.log('   Teams:   CodeCrusaders, BinaryBeasts, AlgoAces, NullPointers,');
    console.log('            RuntimeError, SegFault, InfiniteLoop, HelloWorld');
    console.log('   All team password: pass123');
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
