const User = require('./User');
const Admin = require('./Admin');
const Game = require('./Game');
const Draw = require('./Draw');
const LotteryTicket = require('./LotteryTicket');
const AbcTicket = require('./AbcTicket');
const LotteryResult = require('./LotteryResult');
const AbcResult = require('./AbcResult');
const Transaction = require('./Transaction');

// ── User
User.hasMany(LotteryTicket, { foreignKey: 'user_id', as: 'lotteryTickets' });
User.hasMany(AbcTicket,     { foreignKey: 'user_id', as: 'abcTickets' });
User.hasMany(Transaction,   { foreignKey: 'user_id', as: 'transactions' });
User.belongsTo(User,        { foreignKey: 'referred_by', as: 'referrer' });

// ── Game → Draw
Game.hasMany(Draw, { foreignKey: 'game_id', as: 'draws' });
Draw.belongsTo(Game, { foreignKey: 'game_id', as: 'game' });

// ── Draw → Tickets
Draw.hasMany(LotteryTicket, { foreignKey: 'draw_id', as: 'lotteryTickets' });
Draw.hasMany(AbcTicket,     { foreignKey: 'draw_id', as: 'abcTickets' });

// ── Draw → Results (one-to-one)
Draw.hasOne(LotteryResult, { foreignKey: 'draw_id', as: 'lotteryResult' });
Draw.hasOne(AbcResult,     { foreignKey: 'draw_id', as: 'abcResult' });

// ── Tickets → User & Draw
LotteryTicket.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
LotteryTicket.belongsTo(Draw, { foreignKey: 'draw_id', as: 'draw' });
AbcTicket.belongsTo(User,     { foreignKey: 'user_id', as: 'user' });
AbcTicket.belongsTo(Draw,     { foreignKey: 'draw_id', as: 'draw' });

// ── Results → Draw & Admin
LotteryResult.belongsTo(Draw, { foreignKey: 'draw_id',     as: 'draw' });
LotteryResult.belongsTo(User, { foreignKey: 'announced_by', as: 'announcedBy' }); // Optionally change this to Admin later
AbcResult.belongsTo(Draw,     { foreignKey: 'draw_id',     as: 'draw' });
AbcResult.belongsTo(User,     { foreignKey: 'announced_by', as: 'announcedBy' }); // Optionally change this to Admin later

// ── Transaction → User
Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  User,
  Admin,
  Game,
  Draw,
  LotteryTicket,
  AbcTicket,
  LotteryResult,
  AbcResult,
  Transaction,
};
