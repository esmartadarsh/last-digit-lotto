/**
 * Blocks any request where the authenticated user is not admin or superadmin.
 * Must be used after the authenticate middleware.
 */
function adminOnly(req, res, next) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}

module.exports = adminOnly;
