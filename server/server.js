require('dotenv').config();

const app = require('./app');
const { sequelize } = require('./src/config/database');
const cron = require('node-cron');
const { closeExpiredDraws, createDailyDraws } = require('./src/services/drawScheduler');

const PORT = process.env.PORT || 3000;

async function start() {
  console.log('start')

  try {

    console.log('start')
    // Test DB connection
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Sync all models (creates tables if they don't exist)
    // Use { force: true } only once to reset tables during development
    await sequelize.sync({ alter: true });
    console.log('✅ Models synced');

    // ── Cron: auto-close expired draws every minute
    cron.schedule('* * * * *', async () => {
      await closeExpiredDraws();
    });

    // ── Cron: auto-create daily draws at midnight
    cron.schedule('0 0 * * *', async () => {
      await createDailyDraws();
    });

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Startup failed:', err);
    process.exit(1);
  }
}

start();
