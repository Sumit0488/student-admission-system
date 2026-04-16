'use strict';
const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const { adminOrAbove } = require('../middleware/auth');

// ── GET /api/users  — list all users in this tenant ──────────────────────────
router.get('/', adminOrAbove, async (req, res) => {
  try {
    const filter = { tenantId: req.tenantId || null };
    if (req.query.role) filter.role = req.query.role;
    if (req.query.q) {
      const re = new RegExp(req.query.q, 'i');
      filter.$or = [{ name: re }, { email: re }];
    }
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/users  — create a new user in this tenant ──────────────────────
router.post('/', adminOrAbove, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password required' });
    if (password.length < 6) return res.status(400).json({ success: false, error: 'Password must be ≥ 6 characters' });

    // Only superadmin can create admin/superadmin users
    const targetRole = role || 'staff';
    if (targetRole === 'superadmin' && req.user.role !== 'superadmin')
      return res.status(403).json({ success: false, error: 'Only superadmin can create superadmin users' });
    if (targetRole === 'admin' && req.user.role === 'staff')
      return res.status(403).json({ success: false, error: 'Staff cannot create admin users' });

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) return res.status(409).json({ success: false, error: 'Email already registered' });

    const user = await User.create({
      name: (name || email).trim(),
      email: email.trim().toLowerCase(),
      password,
      role: targetRole,
      tenantId: req.tenantId || null,
    });
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ── PUT /api/users/:id  — update user (name, role, isActive) ─────────────────
router.put('/:id', adminOrAbove, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, tenantId: req.tenantId || null });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Prevent privilege escalation
    if (req.body.role === 'superadmin' && req.user.role !== 'superadmin')
      return res.status(403).json({ success: false, error: 'Only superadmin can assign superadmin role' });

    const allowed = ['name', 'role', 'isActive'];
    allowed.forEach(k => { if (req.body[k] !== undefined) user[k] = req.body[k]; });

    // Handle password change
    if (req.body.password) {
      if (req.body.password.length < 6) return res.status(400).json({ success: false, error: 'Password must be ≥ 6 characters' });
      user.password = req.body.password;
    }

    await user.save();
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/users/:id  — deactivate a user ───────────────────────────────
router.delete('/:id', adminOrAbove, async (req, res) => {
  try {
    // Prevent self-deletion
    if (String(req.params.id) === String(req.user.userId))
      return res.status(400).json({ success: false, error: 'Cannot deactivate your own account' });

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId || null },
      { $set: { isActive: false } },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, message: 'User deactivated', data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/users/:id/activate ─────────────────────────────────────────────
router.post('/:id/activate', adminOrAbove, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId || null },
      { $set: { isActive: true } },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, message: 'User activated', data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
