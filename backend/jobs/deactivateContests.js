const cron = require('node-cron');
const pool = require('../config/db');

// Run every minute
cron.schedule('* * * * *', async () => {
  try {
    await pool.query(`
      UPDATE contests
      SET is_active = FALSE
      WHERE end_time < NOW() AND is_active = TRUE
    `);
    console.log('[Cron] Inactive contests updated');
  } catch (err) {
    console.error('[Cron] Failed:', err);
  }
});
