const express = require('express');
const router = express.Router();
const { Draw, Game, LotteryResult, AbcResult } = require('../models');

/**
 * GET /api/draws/active
 * All currently open draws — used by the Home page jackpot card countdown.
 */
router.get('/active', async (req, res) => {
  try {
    const draws = await Draw.findAll({
      where: { status: 'open' },
      include: [{ model: Game, as: 'game' }],
      order: [['scheduled_at', 'ASC']],
    });
    return res.json({ success: true, draws });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/draws/:drawId
 * Single draw detail including game info and result (if announced).
 */
router.get('/:drawId', async (req, res) => {
  try {
    const draw = await Draw.findByPk(req.params.drawId, {
      include: [
        { model: Game, as: 'game' },
        { model: LotteryResult, as: 'lotteryResult', required: false },
        { model: AbcResult, as: 'abcResult', required: false },
      ],
    });

    if (!draw) return res.status(404).json({ success: false, message: 'Draw not found' });
    return res.json({ success: true, draw });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
