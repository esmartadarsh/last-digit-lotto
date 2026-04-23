const { admin } = require('../config/firebase');
const { User } = require('../models');

const jwt = require('jsonwebtoken');

/**
 * Verifies the token on every protected request.
 * Can be a local JWT (for admins) or a Firebase Bearer token (for normal users).
 * Attaches req.user (MySQL User or Admin row) for all downstream handlers.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  // 1. Try decoding as Local Admin JWT first
  try {
    const decodedLocal = jwt.verify(token, process.env.JWT_SECRET);
    // If it succeeds, it's an admin token
    const { Admin } = require('../models');
    const adminUser = await Admin.findByPk(decodedLocal.id);
    
    if (!adminUser) {
        return res.status(401).json({ success: false, message: 'Admin not found' });
    }

    req.user = adminUser;
    req.isAdminToken = true;
    return next();
  } catch (jwtErr) {
    // It's not a valid Local JWT. Fall through to Firebase check.
  }

  // 2. Try decoding as Firebase Token
  try {
    const decoded = await admin.auth().verifyIdToken(token);

    const user = await User.findOne({ where: { firebase_uid: decoded.uid } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please call /api/auth/sync first.',
      });
    }

    req.user = user;
    req.firebaseUser = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = authenticate;
