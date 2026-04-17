'use strict';
const express = require('express');
const { getTenantFilter } = require('../utils/tenantFilter');
const router = express.Router();
const Scholarship = require('../models/scholarship.model');
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
    if (req.query.status) filter.scholarship_status = req.query.status;
    if (req.query.academic_year) filter.academic_year = req.query.academic_year;
    if (req.query.student_id) filter.student_id = req.query.student_id;
    const data = await Scholarship.find(filter).sort({ created_at: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const doc = new Scholarship({ ...req.body, ...(req.tenantId && { tenantId: req.tenantId }) });
    await doc.save();
    log('scholarship_created', 'Scholarship Created', {
      entity_id: doc.application_no || String(doc._id),
      entity_label: doc.student_name,
      student_name: doc.student_name,
      amount: doc.scholarship_amount,
      details: `Scholarship application created for ${doc.student_name}`,
      ...(req.tenantId && { tenantId: req.tenantId }),
    }, req);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const doc = await Scholarship.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    log('scholarship_updated', 'Scholarship Updated', {
      entity_id: doc.application_no || String(doc._id),
      entity_label: doc.student_name,
      student_name: doc.student_name,
      amount: doc.scholarship_amount,
      details: `Scholarship updated — status: ${doc.scholarship_status}`,
      ...(req.tenantId && { tenantId: req.tenantId }),
    }, req);
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const doc = await Scholarship.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    log('scholarship_deleted', 'Scholarship Deleted', {
      entity_id: doc.application_no || String(doc._id),
      entity_label: doc.student_name,
      student_name: doc.student_name,
      details: `Scholarship for ${doc.student_name} deleted`,
      ...(req.tenantId && { tenantId: req.tenantId }),
    }, req);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
