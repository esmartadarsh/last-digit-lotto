const express = require('express');
const router = express.Router();
const { admin } = require('../config/firebase');
const { User } = require('../models');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/auth/sync
 * Called by the frontend immediately after Firebase login.
 * Creates a new MySQL user row if this Firebase UID hasn't been seen before.
 * Safe to call multiple times — idempotent.
 */
router.post('/sync', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = await admin.auth().verifyIdToken(token);

    let user = await User.findOne({ where: { firebase_uid: decoded.uid } });

    if (!user) {
      // Generate a unique 6-char referral code
      let referral_code;
      let isUnique = false;
      while (!isUnique) {
        referral_code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const existing = await User.findOne({ where: { referral_code } });
        if (!existing) isUnique = true;
      }

      user = await User.create({
        id: uuidv4(),
        firebase_uid: decoded.uid,
        name: decoded.name || 'Player',
        email: decoded.email || '',
        referral_code,
        avatar_url: decoded.picture || null,
      });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        role: user.role,
        level: user.level,
        referral_code: user.referral_code,
        avatar_url: user.avatar_url,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

module.exports = router;
