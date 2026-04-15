const { admin } = require('../config/firebase');
const { User } = require('../models');

/**
 * Verifies the Firebase Bearer token on every protected request.
 * Attaches req.user (MySQL User row) for all downstream handlers.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

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
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = authenticate;
