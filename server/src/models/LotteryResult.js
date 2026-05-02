const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const LotteryResult = sequelize.define('LotteryResult', {
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
  // Full 8-char winning number e.g. "88C20662"
  winning_number: {
    type: DataTypes.STRING(8),
    allowNull: false,
  },
  // Multi-prize numbers stored as JSON:
  // { second: [...5-digit], third: [...4-digit], fourth: [...4-digit], fifth: [...4-digit] }
  prizes: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
  },
  // Firebase Storage URL of the official result image
  result_image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
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
  tableName: 'lottery_results',
  timestamps: false,
});

module.exports = LotteryResult;
