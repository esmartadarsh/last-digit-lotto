const { messaging } = require('../config/firebase');
const { User, LotteryTicket, AbcTicket } = require('../models');

/**
 * Sends an FCM push notification to all users who have tickets in a specific draw.
 */
async function sendResultNotification(drawId, type, result) {
  try {
    const Model = type === 'lottery' ? LotteryTicket : AbcTicket;

    // Get unique user IDs in this draw
    const tickets = await Model.findAll({
      where: { draw_id: drawId },
      attributes: ['user_id'],
      group: ['user_id'],
    });

    if (tickets.length === 0) return;

    const userIds = tickets.map((t) => t.user_id);
    const users = await User.findAll({
      where: { id: userIds },
      attributes: ['fcm_token'],
    });

    const tokens = users.map((u) => u.fcm_token).filter(Boolean);
    if (tokens.length === 0) return;

    const body =
      type === 'lottery'
        ? `Winning number: ${result}`
        : `A = ${result.a}, B = ${result.b}, C = ${result.c}`;

    await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: type === 'lottery' ? '🎰 Lottery Result Out!' : '🎲 ABC Result Out!',
        body,
      },
    });

    console.log(`✅ Notifications sent to ${tokens.length} user(s)`);
  } catch (err) {
    console.error('❌ Notification error:', err.message);
  }
}

/**
 * Sends a targeted notification to a single user (e.g. "You won!").
 */
async function sendWinNotification(userId, amount, gameName) {
  try {
    const user = await User.findByPk(userId, { attributes: ['fcm_token'] });
    if (!user || !user.fcm_token) return;

    await messaging.send({
      token: user.fcm_token,
      notification: {
        title: '🏆 Congratulations! You Won!',
        body: `₹${amount} has been credited to your wallet from ${gameName}`,
      },
    });
  } catch (err) {
    console.error('❌ Win notification error:', err.message);
  }
}

module.exports = { sendResultNotification, sendWinNotification };
