'use strict';
const express = require('express');
const router = express.Router();
const Tenant = require('../models/tenant.model');
const User = require('../models/user.model');
const { superAdminOnly, signToken } = require('../middleware/auth');

// All routes in this file require superadmin role
router.use(superAdminOnly);

// ── GET /api/super-admin/tenants ─────────────────────────────────────────────
router.get('/tenants', async (req, res) => {
  try {
    const { q, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (q) { const re = new RegExp(q, 'i'); filter.$or = [{ name: re }, { code: re }, { domain: re }]; }
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Tenant.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Tenant.countDocuments(filter),
    ]);

    // Attach user count per tenant
    const tenantIds = data.map(t => t._id);
    const userCounts = await User.aggregate([
      { $match: { tenantId: { $in: tenantIds } } },
      { $group: { _id: '$tenantId', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(userCounts.map(u => [String(u._id), u.count]));
    const result = data.map(t => ({ ...t.toObject(), userCount: countMap[String(t._id)] || 0 }));

    res.json({ success: true, data: result, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/super-admin/tenants/:id ─────────────────────────────────────────
router.get('/tenants/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ success: false, error: 'Tenant not found' });
    const users = await User.find({ tenantId: tenant._id }).select('-password');
    res.json({ success: true, data: { ...tenant.toObject(), users } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/super-admin/tenants ─────────────────────────────────────────────
router.post('/tenants', async (req, res) => {
  try {
    const { name, domain, address, city, state, phone, website, adminEmail, adminPassword, adminName } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'Institution name required' });
    if (!adminEmail?.trim()) return res.status(400).json({ success: false, error: 'Admin email required' });
    if (!adminPassword || adminPassword.length < 6)
      return res.status(400).json({ success: false, error: 'Admin password must be ≥ 6 chars' });

    const existing = await Tenant.findOne({ name: name.trim() });
    if (existing) return res.status(409).json({ success: false, error: 'Institution name already exists' });

    const tenant = await Tenant.create({ name: name.trim(), domain, address, city, state, phone, website });

    const emailNorm = adminEmail.trim().toLowerCase();
    const existingUser = await User.findOne({ email: emailNorm });
    if (existingUser) return res.status(409).json({ success: false, error: 'Admin email already registered' });

    const adminUser = await User.create({
      name: (adminName || adminEmail).trim(),
      email: emailNorm,
      password: adminPassword,
      role: 'admin',
      tenantId: tenant._id,
    });

    res.status(201).json({
      success: true,
      data: { tenant, admin: { id: adminUser._id, name: adminUser.name, email: adminUser.email } },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/super-admin/tenants/:id ─────────────────────────────────────────
router.put('/tenants/:id', async (req, res) => {
  try {
    const allowed = ['name', 'domain', 'address', 'city', 'state', 'pin_code', 'phone', 'website', 'isActive', 'extra'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    const tenant = await Tenant.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!tenant) return res.status(404).json({ success: false, error: 'Tenant not found' });
    res.json({ success: true, data: tenant });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ── PATCH /api/super-admin/tenants/:id/toggle ────────────────────────────────
router.patch('/tenants/:id/toggle', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ success: false, error: 'Tenant not found' });
    tenant.isActive = !tenant.isActive;
    await tenant.save();
    res.json({ success: true, data: tenant, message: tenant.isActive ? 'Tenant activated' : 'Tenant deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/super-admin/tenants/:id ──────────────────────────────────────
router.delete('/tenants/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndDelete(req.params.id);
    if (!tenant) return res.status(404).json({ success: false, error: 'Tenant not found' });
    // Deactivate all users for this tenant
    await User.updateMany({ tenantId: req.params.id }, { $set: { isActive: false } });
    res.json({ success: true, message: 'Tenant deleted and users deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/super-admin/stats ────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totalTenants, activeTenants, totalUsers] = await Promise.all([
      Tenant.countDocuments({}),
      Tenant.countDocuments({ isActive: true }),
      User.countDocuments({ role: { $ne: 'superadmin' } }),
    ]);
    res.json({ success: true, data: { totalTenants, activeTenants, inactiveTenants: totalTenants - activeTenants, totalUsers } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/super-admin/impersonate/:tenantId ──────────────────────────────
// Issue a short-lived token scoped to a tenant (for super admin debugging)
router.post('/impersonate/:tenantId', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.tenantId);
    if (!tenant) return res.status(404).json({ success: false, error: 'Tenant not found' });
    const adminUser = await User.findOne({ tenantId: tenant._id, role: 'admin' });
    if (!adminUser) return res.status(404).json({ success: false, error: 'No admin user for this tenant' });
    const token = signToken({
      userId: String(adminUser._id),
      tenantId: String(tenant._id),
      email: adminUser.email,
      role: adminUser.role,
      impersonatedBy: req.user.email,
    });
    res.json({ success: true, token, tenant: { id: tenant._id, name: tenant.name, code: tenant.code } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
