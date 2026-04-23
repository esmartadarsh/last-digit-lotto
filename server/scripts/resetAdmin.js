/**
 * resetAdmin.js
 * Drops the `admins` table, recreates it (plain-text password, no hashing),
 * then inserts the default admin credentials.
 *
 * Run once:  node scripts/resetAdmin.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { sequelize } = require('../src/config/database');
const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

async function reset() {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connection established.');

    // 1. Drop the existing admins table (force: true = DROP TABLE IF EXISTS)
    await sequelize.query('DROP TABLE IF EXISTS `admins`');
    console.log('🗑️  Dropped `admins` table.');

    // 2. Redefine the model inline with plain-text password (no hash)
    const Admin = sequelize.define('Admin', {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING(255),   // stored as plain text
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: 'Admin',
      },
      role: {
        type: DataTypes.ENUM('admin', 'superadmin'),
        allowNull: false,
        defaultValue: 'admin',
      },
    }, {
      tableName: 'admins',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    });

    // 3. Recreate the table
    await Admin.sync({ force: true });
    console.log('✅ `admins` table recreated.');

    // 4. Insert the seed admin with plain-text password
    await Admin.create({
      id: uuidv4(),
      phone: '9667479529',
      password: '123456',       // plain text, stored as-is
      name: 'Admin',
      role: 'superadmin',
    });
    console.log('✅ Seed admin created  →  phone: 9667479529 / password: 123456');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

reset();
