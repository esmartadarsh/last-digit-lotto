const express = require('express');
const router = express.Router();
const { Game, Draw } = require('../models');

/**
 * GET /api/games
 * Returns all active games for the Home page grid.
 */
router.get('/', async (req, res) => {
  try {
    const games = await Game.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']],
    });
    return res.json({ success: true, games });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/games/:slug
 * Returns one game plus its currently open draws.
 * Used by BuyLotteryTicket and BuyAbcTicket pages to load draw info.
 */
router.get('/:slug', async (req, res) => {
  try {
    const game = await Game.findOne({
      where: { slug: req.params.slug, is_active: true },
      include: [
        {
          model: Draw,
          as: 'draws',
          where: { status: 'open' },
          required: false,
          // ABC games have 2 time slots; lottery has 1
          limit: 2,
          order: [['scheduled_at', 'ASC']],
        },
      ],
    });

    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    return res.json({ success: true, game });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
