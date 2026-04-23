require('dotenv').config();
const mysql = require('mysql2/promise');

async function fix() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME,
  });

  // Drop all _2, _3 ... _N variant indexes (duplicates added by alter:true)
  const [indexes] = await conn.execute('SHOW INDEX FROM users');
  const keysToDrop = indexes
    .map(i => i.Key_name)
    .filter(name => /_([\d]+)$/.test(name) || name.startsWith('users_'));

  console.log('Keys to drop:', keysToDrop);

  for (const k of [...new Set(keysToDrop)]) {
    try {
      await conn.execute(`ALTER TABLE \`users\` DROP INDEX \`${k}\``);
      console.log('Dropped:', k);
    } catch (e) {
      console.log('Could not drop', k, '-', e.message);
    }
  }

  const [remaining] = await conn.execute('SHOW INDEX FROM users');
  console.log('\nRemaining index count:', remaining.length);
  console.log('Keys:', [...new Set(remaining.map(i => i.Key_name))].join(', '));
  await conn.end();
  console.log('\nDone! Server should start cleanly now.');
}

fix().catch(console.error);
