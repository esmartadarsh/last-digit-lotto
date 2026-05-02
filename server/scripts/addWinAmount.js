/**
 * Run once: adds `win_amount` column to lottery_tickets table.
 * node scripts/addWinAmount.js
 */
require('dotenv').config();
const { sequelize } = require('../src/config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB.');

    await sequelize.query(`
      ALTER TABLE lottery_tickets
      ADD COLUMN IF NOT EXISTS win_amount DECIMAL(12,2) NULL DEFAULT NULL AFTER status;
    `);

    console.log('✅ Column `win_amount` added to lottery_tickets.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
})();
