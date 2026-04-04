const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const LANGUAGES = [
  { id: 1, name: 'C++', extension: 'cpp' },
  { id: 2, name: 'Python', extension: 'py' },
  { id: 3, name: 'Java', extension: 'java' },
];

async function seedLanguages() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const language of LANGUAGES) {
      await client.query(
        `
          INSERT INTO languages (id, name, extension)
          VALUES ($1, $2, $3)
          ON CONFLICT (id)
          DO UPDATE SET
            name = EXCLUDED.name,
            extension = EXCLUDED.extension
        `,
        [language.id, language.name, language.extension]
      );
    }

    await client.query('COMMIT');
    console.log(`Seeded ${LANGUAGES.length} languages.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to seed languages:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seedLanguages();
