const { sequelize } = require('./src/config/database');
const { closeExpiredDraws, createDailyDraws } = require('./src/services/drawScheduler');
const { Admin } = require('./src/models');
const bcrypt = require('bcrypt');
const app = require('./app');
const cron = require('node-cron');
require('dotenv').config();

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
    await sequelize.sync({ alter: false });
    console.log('✅ Models synced');

    // ── Seed Admin

    const defaultAdminPhone = '9667479529';
    let adminUser = await Admin.findOne({ where: { phone: defaultAdminPhone } });
    if (!adminUser) {
      await Admin.create({
        phone: defaultAdminPhone,
        password: '123456',
        name: 'Super Admin',
        role: 'superadmin'
      });
      console.log('✅ Created default admin user (9667479527 / 123456)');
    }

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
