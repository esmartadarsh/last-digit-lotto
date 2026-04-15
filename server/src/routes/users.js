const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { User } = require('../models');

/**
 * GET /api/users/me
 * Returns the authenticated user's full profile.
 */
router.get('/me', authenticate, async (req, res) => {
  return res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      balance: req.user.balance,
      role: req.user.role,
      level: req.user.level,
      is_verified: req.user.is_verified,
      referral_code: req.user.referral_code,
      avatar_url: req.user.avatar_url,
      created_at: req.user.created_at,
    },
  });
});

/**
 * PUT /api/users/me
 * Updates name, phone, avatar_url.
 */
router.put('/me', authenticate, async (req, res) => {
  try {
    const { name, phone, avatar_url } = req.body;
    await req.user.update({
      ...(name && { name }),
      ...(phone && { phone }),
      ...(avatar_url && { avatar_url }),
    });
    return res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/users/me/fcm-token
 * Saves or updates the device FCM token for push notifications.
 */
router.post('/me/fcm-token', authenticate, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token required' });
    await req.user.update({ fcm_token: token });
    return res.json({ success: true, message: 'FCM token saved' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
