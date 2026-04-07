'use strict';

const express = require('express');
const router = express.Router();
const Tenant = require('../models/tenant.model');
const User = require('../models/user.model');
const { signToken, requireAuth } = require('../middleware/auth');

// ── POST /api/auth/register ───────────────────────────────────────────────────
// Finds or creates a tenant by institution name, then creates a new admin user.
router.post('/register', async (req, res) => {
  try {
    const { tenantName, email, password, name } = req.body;
    if (!tenantName?.trim())
      return res.status(400).json({ success: false, error: 'Institution name required' });
    if (!email?.trim()) return res.status(400).json({ success: false, error: 'Email required' });
    if (!password || password.length < 6)
      return res
        .status(400)
        .json({ success: false, error: 'Password must be at least 6 characters' });

    const emailNorm = email.trim().toLowerCase();
    const nameNorm = tenantName.trim();
    const code = Tenant.generateCode(nameNorm);

    // Find by name first (unique), then fall back to code match
    let tenant = await Tenant.findOne({ name: nameNorm });
    if (!tenant) tenant = await Tenant.findOne({ code });
    if (!tenant) {
      tenant = await Tenant.create({ name: nameNorm, code });
    }

    // Check email uniqueness
    const existingUser = await User.findOne({ email: emailNorm });
    if (existingUser) {
      if (String(existingUser.tenantId) === String(tenant._id)) {
        return res
          .status(409)
          .json({
            success: false,
            error: 'Email already registered for this institution. Please sign in.',
          });
      }
      return res
        .status(409)
        .json({ success: false, error: 'Email already registered under another institution.' });
    }

    const user = await User.create({
      name: (name || nameNorm).trim(),
      email: emailNorm,
      password,
      role: 'admin',
      tenantId: tenant._id,
    });

    const token = signToken({
      userId: String(user._id),
      tenantId: String(tenant._id),
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      tenant: { id: tenant._id, name: tenant.name, code: tenant.code },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password, tenantName } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, error: 'Email and password required' });

    const emailNorm = email.trim().toLowerCase();

    // Resolve tenant when institution name is supplied — but never hard-fail:
    // if the tenant isn't found we fall back to email-only lookup so legacy
    // users (registered before multi-tenancy) can still sign in.
    let resolvedTenant = null;
    if (tenantName?.trim()) {
      const nameNorm = tenantName.trim();
      const code = Tenant.generateCode(nameNorm);
      resolvedTenant =
        (await Tenant.findOne({ name: nameNorm })) || (await Tenant.findOne({ code }));
    }

    // Build query: scope to tenant when found, otherwise match by email only
    const userQuery = resolvedTenant
      ? { email: emailNorm, tenantId: resolvedTenant._id }
      : { email: emailNorm };

    let user = await User.findOne({
      ...userQuery,
      $or: [{ isActive: true }, { isActive: { $exists: false } }],
    });

    // Tenant-scoped lookup missed (e.g. user registered before tenancy) —
    // retry with email only so old accounts are never locked out.
    if (!user && resolvedTenant) {
      user = await User.findOne({
        email: emailNorm,
        $or: [{ isActive: true }, { isActive: { $exists: false } }],
      });
    }

    if (!user)
      return res
        .status(401)
        .json({ success: false, error: 'User not found. Please register first.' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ success: false, error: 'Invalid password' });

    // Reuse already-fetched tenant; fall back to user.tenantId lookup for
    // legacy users whose tenant wasn't resolved by name above.
    let tenant = resolvedTenant;
    if (!tenant && user.tenantId) {
      tenant = await Tenant.findById(user.tenantId);
    }
    if (tenant && !tenant.isActive) {
      return res
        .status(403)
        .json({ success: false, error: 'Institution account is inactive. Contact support.' });
    }

    const token = signToken({
      userId: String(user._id),
      tenantId: user.tenantId ? String(user.tenantId) : null,
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      tenant: tenant ? { id: tenant._id, name: tenant.name, code: tenant.code } : null,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    const tenant = req.user.tenantId ? await Tenant.findById(req.user.tenantId) : null;
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user, tenant });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/auth/add-user ───────────────────────────────────────────────────
// Admin creates additional users within the same tenant.
router.post('/add-user', requireAuth, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, error: 'Email and password required' });

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing)
      return res.status(409).json({ success: false, error: 'Email already registered' });

    const user = await User.create({
      name: (name || email).trim(),
      email: email.trim().toLowerCase(),
      password,
      role: role || 'staff',
      tenantId: req.tenantId || null,
    });
    res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
