const { sequelize } = require('../config/database');
const { AbcTicket, AbcResult, Draw, Transaction, User } = require('../models');
const { syncResultToFirestore } = require('./firestoreSync');
const { sendResultNotification, sendWinNotification } = require('./notificationService');
const { storage } = require('../config/firebase');

const WIN_AMOUNTS = {
  single: 100,    // ₹100
  double: 1000,   // ₹1,000
  triple: 15000,  // ₹15,000
};

/**
 * Determines whether an ABC ticket wins given the announced result.
 * All bets are positional (exact order):
 *   Single A: ticket.digits must equal result.a
 *   Single B: ticket.digits must equal result.b
 *   Single C: ticket.digits must equal result.c
 *   Double AB: ticket.digits must equal `${result.a}${result.b}`
 *   Double AC: ticket.digits must equal `${result.a}${result.c}`
 *   Double BC: ticket.digits must equal `${result.b}${result.c}`
 *   Triple ABC: ticket.digits must equal `${result.a}${result.b}${result.c}`
 */
function checkWin(ticket, result) {
  const { type, position, digits } = ticket;
  const { a, b, c } = result;

  if (type === 'single') {
    const actual = position === 'A' ? a : position === 'B' ? b : c;
    return digits === String(actual);
  }

  if (type === 'double') {
    if (position === 'AB') return digits === `${a}${b}`;
    if (position === 'AC') return digits === `${a}${c}`;
    if (position === 'BC') return digits === `${b}${c}`;
  }

  if (type === 'triple') {
    return digits === `${a}${b}${c}`;
  }

  return false;
}

/**
 * Called when admin announces A, B, C digits for an ABC draw.
 * Same flow as lottery resolution — all inside one MySQL transaction.
 */
async function resolveAbcDraw(drawId, result, adminUserId) {
  // result = { a: 4, b: 5, c: 6 }
  let winnersCount = 0;
  let totalPaidOut = 0;

  await sequelize.transaction(async (t) => {
    const draw = await Draw.findByPk(drawId, { transaction: t });
    if (!draw) throw Object.assign(new Error('Draw not found'), { status: 404 });
    if (draw.status === 'completed') throw Object.assign(new Error('Draw already resolved'), { status: 400 });

    await draw.update({ status: 'processing' }, { transaction: t });

    // Save result
    // NOTE: announced_by is null because the announcer is an Admin (admins table),
    // not a User (users table). The FK on abc_results.announced_by → users.id
    // would fail if we passed an admin's UUID.
    await AbcResult.create(
      {
        draw_id: drawId,
        a: result.a,
        b: result.b,
        c: result.c,
        announced_by: null,
      },
      { transaction: t }
    );

    // Load all active tickets
    const tickets = await AbcTicket.findAll({
      where: { draw_id: drawId, status: 'active' },
      include: [{ model: User, as: 'user', attributes: ['id', 'balance', 'fcm_token'] }],
      transaction: t,
    });

    // Resolve each ticket
    for (const ticket of tickets) {
      const isWin = checkWin(ticket, result);

      if (isWin) {
        const prizePerUnit = WIN_AMOUNTS[ticket.type];
        const winAmount = prizePerUnit * ticket.qty;
        winnersCount++;
        totalPaidOut += winAmount;

        await ticket.update({ status: 'won', win_amount: winAmount }, { transaction: t });

        const user = ticket.user;
        const balanceBefore = parseFloat(user.balance);
        const balanceAfter = balanceBefore + winAmount;

        await user.update({ balance: balanceAfter }, { transaction: t });
        await Transaction.create(
          {
            user_id: ticket.user_id,
            type: 'win_abc',
            amount: winAmount,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            reference_id: ticket.id,
            reference_type: 'abc_ticket',
            description: `🏆 Won ABC ${ticket.type}! Position: ${ticket.position}, Digits: ${ticket.digits}`,
          },
          { transaction: t }
        );
      } else {
        await ticket.update({ status: 'lost' }, { transaction: t });
      }
    }

    await draw.update({ status: 'completed' }, { transaction: t });
  });

  await syncResultToFirestore(drawId, { type: 'abc', result });
  await sendResultNotification(drawId, 'abc', result);

  // Delete banner from Firebase Storage (non-fatal)
  try {
    const draw = await Draw.findByPk(drawId);
    if (draw?.banner_url) {
      const bucket = storage.bucket();
      const match = draw.banner_url.match(/\/o\/([^?]+)/);
      if (match) {
        const filePath = decodeURIComponent(match[1]);
        await bucket.file(filePath).delete();
      }
      await draw.update({ banner_url: null });
    }
  } catch (e) {
    console.warn('Banner cleanup failed (non-fatal):', e.message);
  }

  return { winnersCount, totalPaidOut };
}

module.exports = { resolveAbcDraw };
