require('dotenv').config();
const { sequelize } = require('./src/config/database');

async function fix() {
  try {
    const [indexes] = await sequelize.query(`SHOW INDEX FROM users`);
    console.log("Indexes in users table:");
    const indexNames = [...new Set(indexes.map(i => i.Key_name))].filter(name => name !== 'PRIMARY');
    console.log(indexNames);

    console.log("Dropping extra indexes...");
    for (const name of indexNames) {
      try {
        await sequelize.query(`ALTER TABLE users DROP INDEX \`${name}\``);
        console.log(`Dropped ${name}`);
      } catch(e) {
        console.log(`Failed to drop ${name}: ${e.message}`);
      }
    }
    
    console.log("✅ Fixed! You can run the server now.");
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

fix();
