/**
 * Run once: adds `prizes` JSON column to lottery_results table.
 * node scripts/addPrizesColumn.js
 */
require('dotenv').config();
const { sequelize } = require('../src/config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB.');

    await sequelize.query(`
      ALTER TABLE lottery_results
      ADD COLUMN IF NOT EXISTS prizes JSON NULL AFTER winning_number;
    `);

    console.log('✅ Column `prizes` added to lottery_results.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
})();
