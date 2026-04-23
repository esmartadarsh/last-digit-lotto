const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Draw = sequelize.define('Draw', {
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  game_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  // Exact time when ticket purchases close and draw result is announced
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  // Only for ABC games
  time_slot: {
    type: DataTypes.ENUM('1PM', '8PM'),
    allowNull: true,
  },
  // Price snapshot at the time of draw creation
  ticket_price: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('open', 'closed', 'processing', 'completed'),
    allowNull: false,
    defaultValue: 'open',
  },
  // Firestore document ID for realtime sync
  firestore_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  // Firebase Storage URL for draw banner image
  banner_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: 'draws',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['game_id'] },
    { fields: ['status'] },
    { fields: ['scheduled_at'] },
  ],
});

module.exports = Draw;
