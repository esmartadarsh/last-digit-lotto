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
        name: decoded.name || (decoded.phone_number ? `User ${decoded.phone_number.slice(-4)}` : 'Player'),
        email: decoded.email || null,       // phone users have no email — store null not ''
        phone: decoded.phone_number || null, // Firebase puts phone here for phone auth
        is_verified: !!decoded.email_verified || !!decoded.phone_number,
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
        phone: user.phone,
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

/**
 * POST /api/auth/admin/login
 * Custom JWT-based manual login for admins bypassing Firebase.
 */
const jwt = require('jsonwebtoken');
const { Admin } = require('../models');

router.post('/admin/login', async (req, res) => {

  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ success: false, message: 'Phone and password are required' });
  }

  try {
    const adminUser = await Admin.findOne({ where: { phone } });
    // console.log(adminUser, 'see admin users')
    if (!adminUser) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Plain-text password comparison (passwords stored as-is, no hashing)
    if (password !== adminUser.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Issue local JWT
    const token = jwt.sign(
      { id: adminUser.id, role: adminUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: adminUser.id,
        name: adminUser.name,
        phone: adminUser.phone,
        role: adminUser.role,
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * GET /api/auth/admin/me
 * Returns the admin payload based on the local JWT.
 */
const authenticate = require('../middleware/auth'); // We will update auth.js middleware to handle both soon

router.get('/admin/me', authenticate, async (req, res) => {
  // If authenticate middleware passes, it sets req.user.
  // We can just return it.
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Not an admin' });
    }



    return res.json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        phone: req.user.phone,
        role: req.user.role,
        balance: req.user.balance,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
