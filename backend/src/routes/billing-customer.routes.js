'use strict';
const express = require('express');
const { getTenantFilter } = require('../utils/tenantFilter');
const router = express.Router();
const BillingCustomer = require('../models/billing-customer.model');
const ActivityLog = require('../models/activity-log.model');

const log = (action, label, data, req) =>
  ActivityLog.create({
    module: 'Billing', action, action_label: label,
    performed_by: req?.user?.name || req?.user?.email || 'Admin',
    ip: req?.ip,
    ...data,
  }).catch(() => {});

router.get('/', async (req, res) => {
  try {
    const tf = getTenantFilter(req.tenantId);
    const filter = { ...tf };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.q) {
      const re = new RegExp(req.query.q, 'i');
      filter.$or = [{ name: re }, { customer_id: re }, { email: re }, { mobile_number: re }];
    }

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const [data, total] = await Promise.all([
      BillingCustomer.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit),
      BillingCustomer.countDocuments(filter),
    ]);
    res.json({ success: true, data, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { mobile_number } = req.body;
    if (mobile_number && !/^\d{10}$/.test(mobile_number)) {
      return res.status(400).json({ success: false, error: 'Mobile number must be exactly 10 digits' });
    }
    const doc = new BillingCustomer({ ...req.body, ...(req.tenantId && { tenantId: req.tenantId }) });
    await doc.save();
    log('customer_created', 'Customer Created', {
      entity_id: doc.customer_id || String(doc._id),
      entity_label: doc.name,
      student_name: doc.name,
      details: `Customer ${doc.name} created`,
      ...(req.tenantId && { tenantId: req.tenantId }),
    }, req);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/bulk-upload', async (req, res) => {
  try {
    const rows = req.body.rows || [];
    let created = 0;
    const errors = [];
    for (const row of rows) {
      try {
        if (!row.name) { errors.push({ name: row.name || '?', error: 'name is required' }); continue; }
        const doc = new BillingCustomer({
          name: row.name,
          mobile_number: row.mobile_number || '',
          email: row.email || '',
          stream: row.stream || '',
          program: row.program || '',
          status: 'Active',
          ...(req.tenantId && { tenantId: req.tenantId }),
        });
        await doc.save();
        created++;
      } catch (e) {
        errors.push({ name: row.name || '?', error: e.message });
      }
    }
    if (created > 0) {
      log('bulk_upload', 'Bulk Upload', {
        details: `${created} customers uploaded via bulk upload`,
        ...(req.tenantId && { tenantId: req.tenantId }),
      }, req);
    }
    res.json({ success: true, data: { created, errors } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await BillingCustomer.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const doc = await BillingCustomer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    log('customer_updated', 'Customer Updated', {
      entity_id: doc.customer_id || String(doc._id),
      entity_label: doc.name,
      student_name: doc.name,
      details: `Customer ${doc.name} updated`,
      ...(req.tenantId && { tenantId: req.tenantId }),
    }, req);
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const doc = await BillingCustomer.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    log('customer_deleted', 'Customer Deleted', {
      entity_id: doc.customer_id || String(doc._id),
      entity_label: doc.name,
      student_name: doc.name,
      details: `Customer ${doc.name} deleted`,
      ...(req.tenantId && { tenantId: req.tenantId }),
    }, req);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
