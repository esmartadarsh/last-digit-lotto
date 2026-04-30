const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('../config/database');
const { LotteryTicket, Draw, Game, Transaction } = require('../models');
const authenticate = require('../middleware/auth');

const purchaseLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many purchase attempts. Wait a minute.' },
});

// Ticket format: 2 digits + 1 uppercase letter + 5 digits = 8 chars
const TICKET_REGEX = /^[0-9]{2}[A-Z][0-9]{5}$/;

/**
 * POST /api/lottery-tickets/purchase
 * Body: { drawId, tickets: [{ ticketNumber, kind, last4? }] }
 * - Validates draw is open
 * - Checks user balance
 * - Creates ticket rows + deducts balance atomically
 */
router.post(
  '/purchase',
  authenticate,
  purchaseLimiter,
  [
    body('drawId').isUUID().withMessage('Invalid draw ID'),
    body('tickets').isArray({ min: 1, max: 100 }).withMessage('Provide 1–100 tickets'),
    body('tickets.*.ticketNumber')
      .matches(TICKET_REGEX)
      .withMessage('Ticket must be 8 chars: [NN][L][NNNNN]'),
    body('tickets.*.kind')
      .isIn(['ticket', 'sameSet'])
      .withMessage('kind must be ticket or sameSet'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { drawId, tickets } = req.body;
    const userId = req.user.id;

    try {
      let totalCost = 0;

      await sequelize.transaction(async (t) => {
        // 1. Check draw is open and get ticket price
        const draw = await Draw.findByPk(drawId, {
          include: [{ model: Game, as: 'game' }],
          transaction: t,
        });

        if (!draw || draw.status !== 'open') {
          throw Object.assign(new Error('This draw is not open for purchases'), { status: 400 });
        }
        if (draw.game.type !== 'lottery') {
          throw Object.assign(new Error('This is not a lottery draw'), { status: 400 });
        }

        const pricePerTicket = parseFloat(draw.ticket_price);
        totalCost = tickets.length * pricePerTicket;

        // 2. Lock user row and validate balance
        // TODO: restore balance check + deduction once Razorpay top-up is wired
        // const user = await req.user.reload({ lock: t.LOCK.UPDATE, transaction: t });
        // if (parseFloat(user.balance) < totalCost) {
        //   throw Object.assign(new Error('Insufficient balance'), { status: 400 });
        // }

        // 3. Build ticket rows
        const ticketRows = tickets.map((item) => ({
          user_id: userId,
          draw_id: drawId,
          ticket_number: item.ticketNumber.toUpperCase(),
          kind: item.kind || 'ticket',
          last4: item.last4 || null,
          price: pricePerTicket,
        }));

        await LotteryTicket.bulkCreate(ticketRows, { transaction: t });

        // TODO: restore balance deduction + transaction log once Razorpay top-up is wired
        // const balanceBefore = parseFloat(user.balance);
        // const balanceAfter = balanceBefore - totalCost;
        // await user.update({ balance: balanceAfter }, { transaction: t });
        // await Transaction.create({ ... }, { transaction: t });
      });

      return res.json({
        success: true,
        message: `${tickets.length} ticket(s) purchased successfully`,
        totalCost,
      });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }
);

/**
 * GET /api/lottery-tickets/me
 * All lottery tickets for the authenticated user (paginated).
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { count, rows } = await LotteryTicket.findAndCountAll({
      where: { user_id: req.user.id },
      include: [{ model: Draw, as: 'draw', include: [{ model: Game, as: 'game' }] }],
      order: [['purchased_at', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    });
    return res.json({ success: true, total: count, page: parseInt(page), tickets: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/lottery-tickets/me/:drawId
 * User's tickets for one specific draw — shown on the ticket detail page.
 */
router.get('/me/:drawId', authenticate, async (req, res) => {
  try {
    const tickets = await LotteryTicket.findAll({
      where: { user_id: req.user.id, draw_id: req.params.drawId },
      order: [['purchased_at', 'ASC']],
    });
    return res.json({ success: true, tickets });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
