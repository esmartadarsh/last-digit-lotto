const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../config/database');
const { Draw, Game, User, LotteryTicket, AbcTicket, Transaction } = require('../models');
const authenticate = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { resolveLotteryDraw } = require('../services/lotteryResolution');
const { resolveAbcDraw } = require('../services/abcResolution');
const { createDrawInFirestore, syncDrawStatusToFirestore } = require('../services/firestoreSync');
const { storage } = require('../config/firebase');

// Every admin route requires auth + admin role
router.use(authenticate, adminOnly);

/* ═══════════════════════════ DRAWS ═══════════════════════════ */

/**
 * POST /api/admin/draws
 * Create a new draw manually.
 */
router.post(
  '/draws',
  [
    body('game_id').isInt({ min: 1 }),
    body('scheduled_at').isISO8601().withMessage('Must be ISO date e.g. 2026-04-15T13:00:00'),
    body('ticket_price').isFloat({ min: 1 }),
    body('time_slot').optional().isIn(['1PM', '8PM']),
    body('banner_url').optional().isURL(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const draw = await Draw.create({
        id: uuidv4(),
        game_id: req.body.game_id,
        scheduled_at: req.body.scheduled_at,
        ticket_price: req.body.ticket_price,
        time_slot: req.body.time_slot || null,
        banner_url: req.body.banner_url || null,
      });

      // Push to Firestore for realtime countdown
      await createDrawInFirestore(draw.id, draw);

      return res.json({ success: true, draw });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

/**
 * PUT /api/admin/draws/:drawId/close
 * Manually close a draw (stop ticket purchases).
 */
router.put('/draws/:drawId/close', async (req, res) => {
  try {
    const draw = await Draw.findByPk(req.params.drawId);
    if (!draw) return res.status(404).json({ success: false, message: 'Draw not found' });
    if (draw.status !== 'open') {
      return res.status(400).json({ success: false, message: `Draw is already ${draw.status}` });
    }

    await draw.update({ status: 'closed' });
    await syncDrawStatusToFirestore(draw.id, 'closed');

    return res.json({ success: true, message: 'Draw closed successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/admin/draws/:drawId
 * Delete a draw (only if no tickets have been bought).
 */
router.delete('/draws/:drawId', async (req, res) => {
  try {
    const draw = await Draw.findByPk(req.params.drawId, {
      include: [{ model: Game, as: 'game' }],
    });
    if (!draw) return res.status(404).json({ success: false, message: 'Draw not found' });

    const isLottery = draw.game && draw.game.type === 'lottery';
    const Model = isLottery ? LotteryTicket : AbcTicket;
    
    if (Model) {
      const ticketsCount = await Model.count({ where: { draw_id: draw.id } });
      if (ticketsCount > 0) {
        return res.status(400).json({ success: false, message: 'Cannot delete draw with existing tickets.' });
      }
    }

    await draw.destroy();
    return res.json({ success: true, message: 'Draw deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/admin/draws/:drawId/banner
 * Called from client after upload to delete a banner from Firebase Storage by path.
 */
router.delete('/draws/:drawId/banner', async (req, res) => {
  try {
    const draw = await Draw.findByPk(req.params.drawId);
    if (!draw || !draw.banner_url) return res.status(404).json({ success: false, message: 'No banner found' });

    // Extract the path from the URL and delete from Firebase Storage
    const bucket = storage.bucket();
    const url = draw.banner_url;
    // Firebase Storage URL pattern: .../o/PATH?alt=media
    const match = url.match(/\/o\/([^?]+)/);
    if (match) {
      const filePath = decodeURIComponent(match[1]);
      await bucket.file(filePath).delete().catch(() => {}); // safe delete
    }

    await draw.update({ banner_url: null });
    return res.json({ success: true, message: 'Banner deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/admin/draws
 * List all draws with optional status filter.
 */
router.get('/draws', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = status ? { status } : {};

    const { count, rows } = await Draw.findAndCountAll({
      where,
      include: [{ model: Game, as: 'game' }],
      order: [['scheduled_at', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    });

    return res.json({ success: true, total: count, draws: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/admin/draws/:drawId/summary
 * Ticket count + total revenue for a draw — shown before admin announces result.
 */
router.get('/draws/:drawId/summary', async (req, res) => {
  try {
    const draw = await Draw.findByPk(req.params.drawId, {
      include: [{ model: Game, as: 'game' }],
    });
    if (!draw) return res.status(404).json({ success: false, message: 'Draw not found' });

    const isLottery = draw.game.type === 'lottery';
    const Model = isLottery ? LotteryTicket : AbcTicket;

    const tickets = await Model.findAll({ where: { draw_id: draw.id } });
    const totalRevenue = tickets.reduce(
      (sum, t) => sum + parseFloat(isLottery ? t.price : t.total_price),
      0
    );

    const statusBreakdown = tickets.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});

    return res.json({ success: true, draw, totalTickets: tickets.length, totalRevenue, statusBreakdown });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/* ═══════════════════════════ RESULTS ═══════════════════════════ */

/**
 * POST /api/admin/results/lottery
 * Announce winning number → resolves all tickets.
 */
router.post(
  '/results/lottery',
  [
    body('drawId').isUUID(),
    body('winningNumber')
      .matches(/^[0-9]{2}[A-Z][0-9]{5}$/)
      .withMessage('Format: [NN][L][NNNNN] e.g. 46A42830'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { drawId, winningNumber } = req.body;
      const { winnersCount, totalPaidOut } = await resolveLotteryDraw(
        drawId,
        winningNumber,
        req.user.id
      );

      return res.json({
        success: true,
        message: 'Result announced. All tickets resolved.',
        winnersCount,
        totalPaidOut,
      });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }
);

/**
 * POST /api/admin/results/abc
 * Announce A, B, C digits → resolves all ABC tickets.
 */
router.post(
  '/results/abc',
  [
    body('drawId').isUUID(),
    body('a').isInt({ min: 0, max: 9 }),
    body('b').isInt({ min: 0, max: 9 }),
    body('c').isInt({ min: 0, max: 9 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { drawId, a, b, c } = req.body;
      const { winnersCount, totalPaidOut } = await resolveAbcDraw(
        drawId,
        { a, b, c },
        req.user.id
      );

      return res.json({
        success: true,
        message: 'ABC result announced. All tickets resolved.',
        winnersCount,
        totalPaidOut,
      });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }
);

/* ═══════════════════════════ USERS ═══════════════════════════ */

/**
 * GET /api/admin/users
 * Paginated user list with optional name/email search.
 */
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      raw: true,
      attributes: { exclude: ['firebase_uid', 'fcm_token'] },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    });

    console.log('all users', rows)

    return res.json({ success: true, total: count, users: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/admin/users/:id
 * Single user detail.
 */
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['firebase_uid', 'fcm_token'] },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/admin/users/:id/balance
 * Manual balance adjustment with a required reason string.
 */
router.put(
  '/users/:id/balance',
  [body('amount').isFloat(), body('reason').isString().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const { amount, reason } = req.body;
      const balanceBefore = parseFloat(user.balance);
      const balanceAfter = balanceBefore + parseFloat(amount);

      if (balanceAfter < 0) {
        return res.status(400).json({ success: false, message: 'Balance cannot go negative' });
      }

      await user.update({ balance: balanceAfter });
      await Transaction.create({
        user_id: user.id,
        type: amount > 0 ? 'deposit' : 'withdrawal',
        amount: parseFloat(amount),
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description: `Admin adjustment by ${req.user.name}: ${reason}`,
      });

      return res.json({ success: true, newBalance: balanceAfter });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

/* ═══════════════════════════ TRANSACTIONS ═══════════════════════════ */

/**
 * GET /api/admin/transactions
 * All transactions across all users (paginated).
 */
router.get('/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const { count, rows } = await Transaction.findAndCountAll({
      order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    });
    return res.json({ success: true, total: count, transactions: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/* ═══════════════════════════ GAMES ═══════════════════════════ */

/**
 * POST /api/admin/games
 * Create a new game entry.
 */
router.post(
  '/games',
  [
    body('name').isString().notEmpty(),
    body('slug').isString().notEmpty(),
    body('type').isIn(['lottery', 'abc']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const game = await Game.create({
        name: req.body.name,
        slug: req.body.slug,
        type: req.body.type,
        banner_url: req.body.banner_url || null,
      });
      return res.json({ success: true, game });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

/**
 * PUT /api/admin/games/:gameId/toggle-active
 * Toggle a game's active status.
 */
router.put('/games/:gameId/toggle-active', async (req, res) => {
  try {
    const game = await Game.findByPk(req.params.gameId);
    if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
    
    await game.update({ is_active: !game.is_active });
    return res.json({ success: true, game, message: `Game is now ${game.is_active ? 'active' : 'inactive'}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
