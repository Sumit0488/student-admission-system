'use strict';
const jwt = require('jsonwebtoken');

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
 * signToken — helper used in auth routes.
 */
const signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

module.exports = { requireAuth, softAuth, signToken };
