const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const AbcResult = sequelize.define('AbcResult', {
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  // One result per draw
  draw_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    unique: true,
  },
  // Individual position values 0-9
  a: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  b: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  c: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // admin id (from admins table) who announced this — nullable because admins
  // are stored in a separate table and cannot satisfy the FK to users.id
  announced_by: {
    type: DataTypes.CHAR(36),
    allowNull: true,
  },
  announced_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'abc_results',
  timestamps: false,
});

module.exports = AbcResult;
