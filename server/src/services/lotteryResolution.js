const { sequelize } = require('../config/database');
const { LotteryTicket, LotteryResult, Draw, Transaction, User } = require('../models');
const { syncResultToFirestore } = require('./firestoreSync');
const { sendResultNotification, sendWinNotification } = require('./notificationService');

// Prize for matching the exact winning ticket number
const JACKPOT_PRIZE = 100000; // ₹1,00,000

/**
 * Called when admin announces the lottery winning number.
 * Runs inside a single MySQL transaction:
 *   1. Saves the result
 *   2. Marks every ticket won/lost
 *   3. Credits winners' balances
 *   4. Writes transaction logs
 *   5. Marks draw completed
 * Then pushes to Firestore and sends FCM (outside the DB transaction).
 */
async function resolveLotteryDraw(drawId, winningNumber, adminUserId) {
  let winnersCount = 0;
  let totalPaidOut = 0;

  await sequelize.transaction(async (t) => {
    const draw = await Draw.findByPk(drawId, { transaction: t });
    if (!draw) throw Object.assign(new Error('Draw not found'), { status: 404 });
    if (draw.status === 'completed') throw Object.assign(new Error('Draw already resolved'), { status: 400 });

    // 1. Mark draw as processing (blocks any late ticket purchases)
    await draw.update({ status: 'processing' }, { transaction: t });

    // 2. Save winning number
    await LotteryResult.create(
      { draw_id: drawId, winning_number: winningNumber.toUpperCase(), announced_by: adminUserId },
      { transaction: t }
    );

    // 3. Load all active tickets with their owner
    const tickets = await LotteryTicket.findAll({
      where: { draw_id: drawId, status: 'active' },
      include: [{ model: User, as: 'user', attributes: ['id', 'balance', 'fcm_token'] }],
      transaction: t,
    });

    // 4. Resolve each ticket
    for (const ticket of tickets) {
      const isWin = ticket.ticket_number === winningNumber.toUpperCase();
      await ticket.update({ status: isWin ? 'won' : 'lost' }, { transaction: t });

      if (isWin) {
        winnersCount++;
        totalPaidOut += JACKPOT_PRIZE;

        const user = ticket.user;
        const balanceBefore = parseFloat(user.balance);
        const balanceAfter = balanceBefore + JACKPOT_PRIZE;

        await user.update({ balance: balanceAfter }, { transaction: t });
        await Transaction.create(
          {
            user_id: ticket.user_id,
            type: 'win_lottery',
            amount: JACKPOT_PRIZE,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            reference_id: ticket.id,
            reference_type: 'lottery_ticket',
            description: `🏆 Won lottery! Ticket: ${ticket.ticket_number}`,
          },
          { transaction: t }
        );
      }
    }

    // 5. Mark draw completed
    await draw.update({ status: 'completed' }, { transaction: t });
  });

  // 6. Realtime push (outside DB transaction — non-fatal if it fails)
  await syncResultToFirestore(drawId, { type: 'lottery', winningNumber });

  // 7. FCM notifications
  await sendResultNotification(drawId, 'lottery', winningNumber);

  return { winnersCount, totalPaidOut };
}

module.exports = { resolveLotteryDraw };
