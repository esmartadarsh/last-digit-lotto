/**
 * One-time migration: change transactions.reference_id from CHAR(36) to VARCHAR(100)
 * so it can store Razorpay payment IDs (which are not UUIDs).
 *
 * Run with: node scripts/migrate_reference_id.js
 */
require('dotenv').config();
const { sequelize } = require('../src/config/database');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');

    await sequelize.query(
      'ALTER TABLE transactions MODIFY COLUMN reference_id VARCHAR(100) NULL;'
    );
    console.log('✅ reference_id column changed to VARCHAR(100)');
  } catch (err) {
    if (err.message && err.message.includes('already')) {
      console.log('ℹ️  Column already up to date, skipping.');
    } else {
      console.error('❌ Migration failed:', err.message);
    }
  } finally {
    await sequelize.close();
  }
}

run();
