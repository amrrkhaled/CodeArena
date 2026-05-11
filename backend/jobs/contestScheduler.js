const cron = require('node-cron');
const pool = require('../config/db');

// Run every minute
cron.schedule('* * * * *', async () => {
  try {
    // UPCOMING → ACTIVE when start_time is reached
    await pool.query(`
      UPDATE contests
      SET status = 'ACTIVE'
      WHERE status = 'UPCOMING' AND start_time <= NOW()
    `);

    // ACTIVE / FROZEN → FINISHED when end_time is passed
    await pool.query(`
      UPDATE contests
      SET status = 'FINISHED'
      WHERE status IN ('ACTIVE', 'FROZEN') AND end_time < NOW()
    `);

    console.log('[Cron] Contest statuses updated');
  } catch (err) {
    console.error('[Cron] Failed:', err);
  }
});
