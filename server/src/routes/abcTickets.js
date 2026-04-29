const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('../config/database');
const { AbcTicket, Draw, Game, Transaction } = require('../models');
const authenticate = require('../middleware/auth');

const purchaseLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many purchase attempts. Wait a minute.' },
});

const VALID_POSITIONS = {
  single: ['A', 'B', 'C'],
  double: ['AB', 'AC', 'BC'],
  triple: ['ABC'],
};


/**
 * POST /api/abc-tickets/purchase
 * Body: { drawId, selections: [{ type, position, digits, qty }] }
 */
router.post(
  '/purchase',
  authenticate,
  purchaseLimiter,
  [
    body('drawId').isUUID(),
    body('selections').isArray({ min: 1, max: 20 }),
    body('selections.*.type').isIn(['single', 'double', 'triple']),
    body('selections.*.position').isString().notEmpty(),
    body('selections.*.digits').matches(/^[0-9]{1,3}$/).withMessage('digits must be 1–3 numeric chars'),
    body('selections.*.qty').isInt({ min: 1, max: 100 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { drawId, selections } = req.body;
    const userId = req.user.id;
    let totalCost = 0;

    try {
      await sequelize.transaction(async (t) => {
        // 1. Verify draw
        const draw = await Draw.findByPk(drawId, {
          include: [{ model: Game, as: 'game' }],
          transaction: t,
        });

        if (!draw || draw.status !== 'open') {
          throw Object.assign(new Error('Draw is not open for purchases'), { status: 400 });
        }
        if (draw.game.type !== 'abc') {
          throw Object.assign(new Error('This is not an ABC draw'), { status: 400 });
        }

        // 2. Get prices from the draw record set by admin
        const prices = {
          single: parseFloat(draw.single_digit_price),
          double: parseFloat(draw.double_digit_price),
          triple: parseFloat(draw.triple_digit_price),
        };

        if (isNaN(prices.single) || isNaN(prices.double) || isNaN(prices.triple)) {
          throw Object.assign(new Error('Draw prices are not configured. Please contact admin.'), { status: 400 });
        }

        // 3. Validate each selection and build rows
        const ticketRows = [];

        for (const s of selections) {
          // Check position is valid for this type
          if (!VALID_POSITIONS[s.type].includes(s.position)) {
            throw Object.assign(
              new Error(`Invalid position "${s.position}" for type "${s.type}"`),
              { status: 400 }
            );
          }

          // Check digits length matches type
          const expectedLen = s.type === 'single' ? 1 : s.type === 'double' ? 2 : 3;
          if (s.digits.length !== expectedLen) {
            throw Object.assign(
              new Error(`"${s.type}" requires exactly ${expectedLen} digit(s)`),
              { status: 400 }
            );
          }

          const pricePerTicket = prices[s.type];
          const ticketTotal = pricePerTicket * s.qty;
          totalCost += ticketTotal;

          ticketRows.push({
            user_id: userId,
            draw_id: drawId,
            type: s.type,
            position: s.position,
            digits: s.digits,
            qty: s.qty,
            price_per_ticket: pricePerTicket,
            total_price: ticketTotal,
          });
        }

        // 4. Lock + balance check
        const user = await req.user.reload({ lock: t.LOCK.UPDATE, transaction: t });
        if (parseFloat(user.balance) < totalCost) {
          throw Object.assign(new Error('Insufficient balance'), { status: 400 });
        }

        // 5. Create tickets + deduct balance
        await AbcTicket.bulkCreate(ticketRows, { transaction: t });

        const balanceBefore = parseFloat(user.balance);
        const balanceAfter = balanceBefore - totalCost;
        await user.update({ balance: balanceAfter }, { transaction: t });

        await Transaction.create(
          {
            user_id: userId,
            type: 'bet_abc',
            amount: -totalCost,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            reference_id: drawId,
            reference_type: 'draw',
            description: `Purchased ${selections.length} ABC selection(s)`,
          },
          { transaction: t }
        );
      });

      return res.json({
        success: true,
        message: 'ABC selections purchased successfully',
        totalCost,
      });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }
);

/**
 * GET /api/abc-tickets/me
 * All ABC tickets for the authenticated user (paginated).
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { count, rows } = await AbcTicket.findAndCountAll({
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
 * GET /api/abc-tickets/me/:drawId
 * User's ABC selections for one specific draw.
 */
router.get('/me/:drawId', authenticate, async (req, res) => {
  try {
    const tickets = await AbcTicket.findAll({
      where: { user_id: req.user.id, draw_id: req.params.drawId },
      order: [['purchased_at', 'ASC']],
    });
    return res.json({ success: true, tickets });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
