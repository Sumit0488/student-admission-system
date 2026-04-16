'use strict';
const express = require('express');
const router  = express.Router();
const Tenant  = require('../models/tenant.model');

// GET /api/settings  — return institution/general settings for this tenant
router.get('/', async (req, res) => {
  try {
    // Prefer authenticated tenant, fall back to first tenant
    const filter = req.tenantId ? { _id: req.tenantId } : {};
    let tenant = await Tenant.findOne(filter).lean();
    if (!tenant) tenant = {};
    res.json({ success: true, data: tenant });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/settings  — update institution settings
router.put('/', async (req, res) => {
  try {
    const {
      name, phone, website, address, city, state, pin_code, domain,
      admin_name, admin_email, admin_mobile,
      principal_name, short_name,
    } = req.body;

    const filter = req.tenantId ? { _id: req.tenantId } : {};
    let tenant = await Tenant.findOne(filter);

    if (!tenant) {
      // No tenant yet — create one
      tenant = new Tenant({ name: name || 'Institution', code: 'default' });
    }

    // Update allowed fields
    if (name)          tenant.name          = name;
    if (phone !== undefined)   tenant.phone         = phone;
    if (website !== undefined) tenant.website       = website;
    if (address !== undefined) tenant.address       = address;
    if (city !== undefined)    tenant.city          = city;
    if (state !== undefined)   tenant.state         = state;
    if (pin_code !== undefined) tenant.pin_code     = pin_code;
    if (domain !== undefined)  tenant.domain        = domain;

    // Extra info stored as misc JSON
    if (!tenant.extra) tenant.extra = {};
    if (admin_name !== undefined)    tenant.extra.admin_name    = admin_name;
    if (admin_email !== undefined)   tenant.extra.admin_email   = admin_email;
    if (admin_mobile !== undefined)  tenant.extra.admin_mobile  = admin_mobile;
    if (principal_name !== undefined) tenant.extra.principal_name = principal_name;
    if (short_name !== undefined)    tenant.extra.short_name    = short_name;

    tenant.markModified('extra');
    await tenant.save();
    res.json({ success: true, data: tenant });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
