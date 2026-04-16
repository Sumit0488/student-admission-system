const express = require('express');
const { getTenantFilter } = require('../utils/tenantFilter');
const router = express.Router();
const ActivityLog = require('../models/activity-log.model');

// GET logs with optional module filter and pagination
router.get('/', async (req, res) => {
  try {
    const { module: mod, action, q, page = 1, limit = 50, start, end } = req.query;
    const tf = getTenantFilter(req.tenantId);
    const filter = { ...tf };
    if (mod) filter.module = mod;
    if (action) filter.action = action;
    if (q) {
      const re = new RegExp(q, 'i');
      filter.$or = [{ entity_label: re }, { student_name: re }, { usn: re }, { details: re }];
    }
    if (start || end) {
      filter.createdAt = {};
      if (start) filter.createdAt.$gte = new Date(start);
      if (end) { const d = new Date(end); d.setHours(23,59,59,999); filter.createdAt.$lte = d; }
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      ActivityLog.countDocuments(filter),
    ]);
    res.json({ data, total, page: Number(page) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST create a log entry
router.post('/', async (req, res) => {
  try {
    const log = await ActivityLog.create(req.body);
    res.status(201).json(log);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// DELETE a log entry
router.delete('/:id', async (req, res) => {
  try {
    await ActivityLog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
