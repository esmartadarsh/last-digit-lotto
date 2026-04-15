const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  user_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM(
      'deposit',
      'withdrawal',
      'bet_lottery',
      'bet_abc',
      'win_lottery',
      'win_abc',
      'refund'
    ),
    allowNull: false,
  },
  // Positive = credit, Negative = debit
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  // Snapshots for audit trail — never change these
  balance_before: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  balance_after: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  // ID of the related ticket / draw / payment
  reference_id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
  },
  reference_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'reversed'),
    allowNull: false,
    defaultValue: 'completed',
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['type'] },
    { fields: ['created_at'] },
    { fields: ['user_id', 'created_at'] },
  ],
});

module.exports = Transaction;
