const express = require('express');
const { getTenantFilter } = require('../utils/tenantFilter');
const router = express.Router();
const Alumni = require('../models/alumni.model');
const ActivityLog = require('../models/activity-log.model');

const log = (action, label, data, req) =>
  ActivityLog.create({
    module: 'Alumni', action, action_label: label,
    performed_by: req?.user?.name || req?.user?.email || 'Admin',
    ip: req?.ip,
    ...data,
  }).catch(() => {});

// GET /api/alumni
router.get('/', async (req, res) => {
  try {
    const tf = getTenantFilter(req.tenantId);
    const filter = { ...tf };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.program) filter.program = req.query.program;
    if (req.query.batch) filter.batch = req.query.batch;
    if (req.query.graduation_year) filter.graduation_year = req.query.graduation_year;
    if (req.query.q) {
      const re = new RegExp(req.query.q, 'i');
      filter.$or = [{ name: re }, { usn: re }, { email: re }, { current_company: re }, { alumni_id: re }];
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Alumni.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit),
      Alumni.countDocuments(filter),
    ]);
    res.json({ success: true, data, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/alumni/stats
router.get('/stats', async (req, res) => {
  try {
    const [total, active, byProgram, byYear] = await Promise.all([
      Alumni.countDocuments({}),
      Alumni.countDocuments({ status: 'Active' }),
      Alumni.aggregate([{ $group: { _id: '$program', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
      Alumni.aggregate([{ $group: { _id: '$graduation_year', count: { $sum: 1 } } }, { $sort: { _id: -1 } }, { $limit: 10 }]),
    ]);
    res.json({ success: true, data: { total, active, byProgram, byYear } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/alumni/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await Alumni.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/alumni
router.post('/', async (req, res) => {
  try {
    const doc = new Alumni({ ...req.body, ...(req.tenantId && { tenantId: req.tenantId }) });
    await doc.save();
    log('alumni_added', 'Alumni Added', { entity_id: doc.alumni_id, entity_label: doc.name, student_name: doc.name, usn: doc.usn, details: `${doc.program || ''} ${doc.graduation_year || ''}`.trim() }, req);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/alumni/:id
router.put('/:id', async (req, res) => {
  try {
    const doc = await Alumni.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    log('alumni_updated', 'Alumni Updated', { entity_id: doc.alumni_id, entity_label: doc.name, student_name: doc.name, usn: doc.usn }, req);
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/alumni/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Alumni.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    log('alumni_deleted', 'Alumni Deleted', { entity_id: doc.alumni_id, entity_label: doc.name, student_name: doc.name, usn: doc.usn }, req);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
