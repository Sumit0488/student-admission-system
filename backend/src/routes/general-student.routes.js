'use strict';
const express = require('express');
const { getTenantFilter } = require('../utils/tenantFilter');
const router = express.Router();
const GeneralStudent = require('../models/general-student.model');
const ActivityLog = require('../models/activity-log.model');

const log = (action, label, data, req) =>
  ActivityLog.create({
    module: 'General', action, action_label: label,
    performed_by: req?.user?.name || req?.user?.email || 'Admin',
    ip: req?.ip,
    ...data,
  }).catch(() => {});

router.get('/', async (req, res) => {
  try {
    const tf = getTenantFilter(req.tenantId);
    const filter = { ...tf };
    if (req.query.status)  filter.status  = req.query.status;
    if (req.query.stream)  filter.stream  = req.query.stream;
    if (req.query.program) filter.program = req.query.program;
    if (req.query.q) {
      const re = new RegExp(req.query.q, 'i');
      filter.$or = [{ name: re }, { email: re }, { mobile_number: re }];
    }

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const [data, total] = await Promise.all([
      GeneralStudent.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit),
      GeneralStudent.countDocuments(filter),
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
    const doc = new GeneralStudent({ ...req.body, ...(req.tenantId && { tenantId: req.tenantId }) });
    await doc.save();
    log('student_created', 'Student Created', {
      entity_id: String(doc._id),
      entity_label: doc.name,
      student_name: doc.name,
      details: `Student ${doc.name} added to General module`,
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
        const doc = new GeneralStudent({
          name: row.name,
          mobile_number: row.mobile_number || '',
          email: row.email || '',
          stream: row.stream || '',
          program: row.program || '',
          batch: row.batch || '',
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
        details: `${created} students uploaded via bulk upload`,
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
    const doc = await GeneralStudent.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const doc = await GeneralStudent.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    log('student_updated', 'Student Updated', {
      entity_id: String(doc._id),
      entity_label: doc.name,
      student_name: doc.name,
      details: `Student ${doc.name} updated`,
      ...(req.tenantId && { tenantId: req.tenantId }),
    }, req);
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const doc = await GeneralStudent.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    log('student_deleted', 'Student Deleted', {
      entity_id: String(doc._id),
      entity_label: doc.name,
      student_name: doc.name,
      details: `Student ${doc.name} deleted`,
      ...(req.tenantId && { tenantId: req.tenantId }),
    }, req);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
