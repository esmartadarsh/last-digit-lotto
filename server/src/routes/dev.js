/**
 * ⚠️  DEVELOPER-ONLY NUCLEAR ROUTES ⚠️
 *
 * These routes are ONLY for emergency use by the developer.
 * They are protected by a DEV_SECRET_KEY env variable (NOT admin JWT).
 * The kill-switch wipes the entire MySQL database so the app stops working.
 *
 * HOW TO USE:
 *   DELETE /api/dev/nuke-database
 *   Header: x-dev-secret: <your DEV_SECRET_KEY from .env>
 *   Body:   { "confirm": "DELETE_EVERYTHING" }
 */

const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');

// ── Guard: must be in non-production OR explicitly allowed via env flag ─────
// ── Auth: check the raw DEV_SECRET_KEY header (no JWT needed) ───────────────
function devGuard(req, res, next) {
  const secret = process.env.DEV_SECRET_KEY;

  if (!secret) {
    return res.status(503).json({
      success: false,
      message: 'DEV_SECRET_KEY is not configured on this server. Nuclear routes disabled.',
    });
  }

  const provided = req.headers['x-dev-secret'];
  if (!provided || provided !== secret) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Invalid or missing x-dev-secret header.',
    });
  }

  next();
}

// ── POST /api/dev/nuke-database ───────────────────────────────────────────────
/**
 * Wipes ALL data from every table using TRUNCATE (preserves schema).
 * This effectively kills the app — no users, no draws, no tickets, nothing.
 *
 * Required header: x-dev-secret: <DEV_SECRET_KEY>
 * Required body:   { "confirm": "DELETE_EVERYTHING" }
 */
router.delete('/nuke-database', devGuard, async (req, res) => {
  const { confirm } = req.body;

  if (confirm !== 'DELETE_EVERYTHING') {
    return res.status(400).json({
      success: false,
      message: 'Safety check failed. Send body: { "confirm": "DELETE_EVERYTHING" }',
    });
  }

  try {
    console.warn('🚨 [DEV] Nuclear wipe initiated! Dropping all table data...');

    // Disable FK checks so we can truncate in any order
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Get all table names in the current database
    const [tables] = await sequelize.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = DATABASE()
       AND table_type = 'BASE TABLE'`
    );

    const tableNames = tables.map((t) => t.table_name || t.TABLE_NAME);

    if (tableNames.length === 0) {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      return res.json({ success: true, message: 'No tables found. Database is already empty.' });
    }

    // Truncate every table
    for (const table of tableNames) {
      await sequelize.query(`TRUNCATE TABLE \`${table}\``);
      console.warn(`  ✓ Truncated: ${table}`);
    }

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.warn('🚨 [DEV] Nuclear wipe COMPLETE. All data destroyed.');

    return res.json({
      success: true,
      message: '💀 Database wiped. All tables truncated. The application is now non-functional.',
      tablesWiped: tableNames,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // Re-enable FK checks even on error
    try { await sequelize.query('SET FOREIGN_KEY_CHECKS = 1'); } catch (_) { }
    console.error('[DEV] Nuke failed:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/dev/ping ─────────────────────────────────────────────────────────
// Quick sanity check — confirms the secret works before you hit nuke.
router.get('/ping', devGuard, (req, res) => {
  res.json({
    success: true,
    message: '🔑 Dev secret accepted. Nuclear routes are armed.',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
