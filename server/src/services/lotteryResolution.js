const { sequelize } = require('../config/database');
const { LotteryTicket, LotteryResult, Draw, Transaction, User } = require('../models');
const { syncResultToFirestore } = require('./firestoreSync');
const { sendResultNotification } = require('./notificationService');
const { storage } = require('../config/firebase');

// ── Prize amounts (₹) ──────────────────────────────────────────
const PRIZE_AMOUNTS = {
  first:  1_00_00_000, // ₹1 Crore  (1st prize — full 8-char match)
  second:    10_000,   // ₹10,000   (2nd prize — last 5 digits)
  third:        500,   // ₹500      (3rd prize — last 4 digits)
  fourth:        50,   // ₹50       (4th prize — last 4 digits)
  fifth:         20,   // ₹20       (5th prize — last 4 digits)
};

/**
 * Determine which prize tier (if any) a ticket wins.
 *
 * Matching rules:
 *  1st  — full 8-char ticket number === winningNumber
 *  2nd  — last 5 digits of ticket_number ∈ prizes.second  (5-digit strings)
 *  3rd  — last 4 digits of ticket_number ∈ prizes.third   (4-digit strings)
 *  4th  — last 4 digits of ticket_number ∈ prizes.fourth  (4-digit strings)
 *  5th  — last 4 digits of ticket_number ∈ prizes.fifth   (4-digit strings)
 *
 * Returns the highest matching tier name, or null if no match.
 * Sets are used for O(1) lookup.
 */
function determinePrizeTier(ticketNumber, winningNumber, prizeSets) {
  const tn = ticketNumber.toUpperCase();

  // 1st prize — exact full match
  if (tn === winningNumber.toUpperCase()) return 'first';

  const last5 = tn.slice(-5);
  const last4 = tn.slice(-4);

  // 2nd prize — last 5 digits
  if (prizeSets.second.has(last5)) return 'second';

  // 3rd prize — last 4 digits (checked before 4th/5th for priority)
  if (prizeSets.third.has(last4))  return 'third';

  // 4th prize
  if (prizeSets.fourth.has(last4)) return 'fourth';

  // 5th prize
  if (prizeSets.fifth.has(last4))  return 'fifth';

  return null;
}

/**
 * Called when admin announces the lottery winning number + all prize numbers.
 *
 * @param {string} drawId
 * @param {string} winningNumber   — 8-char 1st prize number e.g. "88C20662"
 * @param {object} prizes          — { second:string[], third:string[], fourth:string[], fifth:string[] }
 * @param {string|null} resultImageUrl — Firebase Storage URL of the result image
 * @param {string} adminUserId
 */
async function resolveLotteryDraw(drawId, winningNumber, prizes, resultImageUrl, adminUserId) {
  let winnersCount = 0;
  let totalPaidOut = 0;

  // Build O(1) lookup Sets for each tier
  const prizeSets = {
    second: new Set((prizes.second  || []).map(n => String(n))),
    third:  new Set((prizes.third   || []).map(n => String(n))),
    fourth: new Set((prizes.fourth  || []).map(n => String(n))),
    fifth:  new Set((prizes.fifth   || []).map(n => String(n))),
  };

  await sequelize.transaction(async (t) => {
    const draw = await Draw.findByPk(drawId, { transaction: t });
    if (!draw) throw Object.assign(new Error('Draw not found'), { status: 404 });
    if (draw.status === 'completed') throw Object.assign(new Error('Draw already resolved'), { status: 400 });

    // 1. Mark draw as processing
    await draw.update({ status: 'processing' }, { transaction: t });

    // 2. Save winning result (all prize numbers stored in prizes JSON column)
    await LotteryResult.create(
      {
        draw_id:          drawId,
        winning_number:   winningNumber.toUpperCase(),
        prizes:           prizes,
        result_image_url: resultImageUrl || null,
        announced_by:     null,
      },
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
      const tier = determinePrizeTier(ticket.ticket_number, winningNumber, prizeSets);

      if (tier) {
        const prizeAmount = PRIZE_AMOUNTS[tier];
        await ticket.update({ status: 'won', win_amount: prizeAmount }, { transaction: t });

        winnersCount++;
        totalPaidOut += prizeAmount;

        const user = ticket.user;
        const balanceBefore = parseFloat(user.balance);
        const balanceAfter  = balanceBefore + prizeAmount;

        await user.update({ balance: balanceAfter }, { transaction: t });
        await Transaction.create(
          {
            user_id:        ticket.user_id,
            type:           'win_lottery',
            amount:         prizeAmount,
            balance_before: balanceBefore,
            balance_after:  balanceAfter,
            reference_id:   ticket.id,
            reference_type: 'lottery_ticket',
            description:    `🏆 Won lottery ${tier} prize! Ticket: ${ticket.ticket_number} — ₹${prizeAmount.toLocaleString('en-IN')}`,
          },
          { transaction: t }
        );
      } else {
        await ticket.update({ status: 'lost' }, { transaction: t });
      }
    }

    // 5. Mark draw completed
    await draw.update({ status: 'completed' }, { transaction: t });
  });

  // 6. Realtime push to Firestore (non-fatal)
  await syncResultToFirestore(drawId, { type: 'lottery', winningNumber });

  // 7. FCM notifications (non-fatal)
  await sendResultNotification(drawId, 'lottery', winningNumber);

  // 8. Clean up draw banner from Firebase Storage (non-fatal)
  try {
    const draw = await Draw.findByPk(drawId);
    if (draw?.banner_url) {
      const bucket = storage.bucket();
      const match = draw.banner_url.match(/\/o\/([^?]+)/);
      if (match) {
        await bucket.file(decodeURIComponent(match[1])).delete();
      }
      await draw.update({ banner_url: null });
    }
  } catch (e) {
    console.warn('Banner cleanup failed (non-fatal):', e.message);
  }

  return { winnersCount, totalPaidOut };
}

module.exports = { resolveLotteryDraw };
