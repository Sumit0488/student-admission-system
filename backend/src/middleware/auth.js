'use strict';
const jwt = require('jsonwebtoken');
const Tenant = require('../models/tenant.model');

if (!process.env.JWT_SECRET) {
  console.warn('[AUTH] WARNING: JWT_SECRET not set in environment. Using insecure default. Set JWT_SECRET in .env before deploying.');
}
const JWT_SECRET = process.env.JWT_SECRET || 'admission_jwt_secret_change_in_prod';

/**
 * requireAuth — hard auth guard.
 * Rejects the request with 401 if no valid JWT is present.
 * Attaches req.user and req.tenantId.
 */
const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    req.tenantId = payload.tenantId || null;
    return next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

/**
 * softAuth — optional auth.
 * Attaches req.user / req.tenantId when a valid JWT is present.
 * Continues without error if no token (used for public routes like student portal).
 */
const softAuth = (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = payload;
      req.tenantId = payload.tenantId || null;
    } catch {
      // Invalid token — ignore, treat as unauthenticated
    }
  }
  next();
};

/**
 * requireRole(...roles) — role guard factory.
 * Usage:  router.delete('/...', requireAuth, requireRole('admin','superadmin'), handler)
 * Must be used AFTER requireAuth so req.user is populated.
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: `Access denied. Required role: ${roles.join(' or ')}`,
    });
  }
  return next();
};

/**
 * superAdminOnly — shorthand guard for superadmin-only routes.
 */
const superAdminOnly = requireRole('superadmin');

/**
 * adminOrAbove — admin or superadmin.
 */
const adminOrAbove = requireRole('admin', 'superadmin');

/**
 * attachTenant — fetches full Tenant document from DB and attaches as req.tenant.
 * Must run AFTER softAuth (which sets req.tenantId).
 * Non-blocking: missing tenantId simply results in req.tenant = null.
 */
const attachTenant = async (req, _res, next) => {
  if (req.tenantId && !req.tenant) {
    try {
      req.tenant = await Tenant.findById(req.tenantId).lean();
    } catch {
      req.tenant = null;
    }
    console.log('[TENANT]', req.tenant ? `${req.tenant.name} (${req.tenant._id})` : 'none');
  }
  next();
};

/**
 * signToken — helper used in auth routes.
 */
const signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

module.exports = { requireAuth, softAuth, attachTenant, signToken, requireRole, superAdminOnly, adminOrAbove };
