const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const LotteryTicket = sequelize.define('LotteryTicket', {
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
  // Full 8-char ticket number e.g. "46A42830"
  ticket_number: {
    type: DataTypes.STRING(8),
    allowNull: false,
  },
  // 'ticket' = single ticket, 'sameSet' = part of a 10-ticket same-last4 group
  kind: {
    type: DataTypes.ENUM('ticket', 'sameSet'),
    allowNull: false,
    defaultValue: 'ticket',
  },
  // Only filled for sameSet kind — used only for UI display
  last4: {
    type: DataTypes.STRING(4),
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'won', 'lost', 'pending'),
    allowNull: false,
    defaultValue: 'active',
  },
  // Filled when status = 'won' — the prize amount credited to the user
  win_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'lottery_tickets',
  timestamps: true,
  createdAt: 'purchased_at',
  updatedAt: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['draw_id'] },
    { fields: ['ticket_number'] },
    { fields: ['status'] },
    { fields: ['user_id', 'draw_id'] },
  ],
});

module.exports = LotteryTicket;
