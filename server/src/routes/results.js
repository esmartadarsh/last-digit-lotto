const express = require('express');
const router = express.Router();
const { LotteryResult, AbcResult, Draw, Game } = require('../models');

/**
 * GET /api/results/lottery/recent
 * Last 10 lottery results across all games — used by the Result History tab.
 */
router.get('/lottery/recent', async (req, res) => {
  try {
    const { game } = req.query; // optional ?game=nagaland-lottery
    const where = {};
    
    const results = await LotteryResult.findAll({
      limit: 10,
      order: [['announced_at', 'DESC']],
      include: [
        {
          model: Draw,
          as: 'draw',
          include: [{ model: Game, as: 'game', where: game ? { slug: game } : undefined }],
        },
      ],
    });

    return res.json({ success: true, results });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/results/abc/recent
 * Last 10 ABC results — used by the ABC Result History tab.
 */
router.get('/abc/recent', async (req, res) => {
  try {
    const { game } = req.query; // optional ?game=nagaland-abc

    const results = await AbcResult.findAll({
      limit: 10,
      order: [['announced_at', 'DESC']],
      include: [
        {
          model: Draw,
          as: 'draw',
          include: [{ model: Game, as: 'game', where: game ? { slug: game } : undefined }],
        },
      ],
    });

    return res.json({ success: true, results });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/results/lottery/:drawId
 * Winning number for a specific lottery draw.
 */
router.get('/lottery/:drawId', async (req, res) => {
  try {
    const result = await LotteryResult.findOne({
      where: { draw_id: req.params.drawId },
      include: [{ model: Draw, as: 'draw', include: [{ model: Game, as: 'game' }] }],
    });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not announced yet' });
    }

    return res.json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/results/abc/:drawId
 * A, B, C digits for a specific ABC draw.
 */
router.get('/abc/:drawId', async (req, res) => {
  try {
    const result = await AbcResult.findOne({
      where: { draw_id: req.params.drawId },
      include: [{ model: Draw, as: 'draw', include: [{ model: Game, as: 'game' }] }],
    });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not announced yet' });
    }

    return res.json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
