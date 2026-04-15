const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const AbcTicket = sequelize.define('AbcTicket', {
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  user_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
  draw_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
  // 'single' | 'double' | 'triple'
  type: {
    type: DataTypes.ENUM('single', 'double', 'triple'),
    allowNull: false,
  },
  // 'A' | 'B' | 'C' | 'AB' | 'AC' | 'BC' | 'ABC'
  position: {
    type: DataTypes.STRING(3),
    allowNull: false,
  },
  // chosen digit(s): '4' | '45' | '456'
  digits: {
    type: DataTypes.STRING(3),
    allowNull: false,
  },
  qty: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  price_per_ticket: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
  },
  // total_price = price_per_ticket * qty
  total_price: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'won', 'lost', 'pending'),
    allowNull: false,
    defaultValue: 'active',
  },
  // Filled after win resolution
  win_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
}, {
  tableName: 'abc_tickets',
  timestamps: true,
  createdAt: 'purchased_at',
  updatedAt: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['draw_id'] },
    { fields: ['status'] },
    { fields: ['user_id', 'draw_id'] },
  ],
});

module.exports = AbcTicket;
