const express = require('express');
const { getTenantFilter } = require('../utils/tenantFilter');
const router = express.Router();
const HostelTimesheet = require('../models/hostel-timesheet.model');
const ActivityLog = require('../models/activity-log.model');

const log = (action, label, data) =>
  ActivityLog.create({ module: 'Hostel', action, action_label: label, ...data }).catch(() => {});

router.get('/', async (req, res) => {
  try {
    const { q, status, hostel_name, date, page = 1, limit = 50 } = req.query;
    const tf = getTenantFilter(req.tenantId);
    const filter = { ...tf };
    if (status) filter.status = status;
    if (hostel_name) filter.hostel_name = new RegExp(hostel_name, 'i');
    if (date) {
      const d = new Date(date);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      filter.date = { $gte: d, $lt: next };
    }
    if (q) {
      const re = new RegExp(q, 'i');
      filter.$or = [{ student_name: re }, { usn: re }, { record_id: re }];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      HostelTimesheet.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(Number(limit)),
      HostelTimesheet.countDocuments(filter),
    ]);
    res.json({ data, total, page: Number(page) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const rec = await HostelTimesheet.findById(req.params.id);
    if (!rec) return res.status(404).json({ message: 'Not found' });
    res.json(rec);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const rec = await HostelTimesheet.create(req.body);
    log('timesheet_recorded', 'Timesheet Recorded', { entity_id: rec.record_id, entity_label: rec.student_name, student_name: rec.student_name, usn: rec.usn, details: `${rec.status} on ${new Date(rec.date).toLocaleDateString()}` });
    res.status(201).json(rec);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// POST bulk create for a date
router.post('/bulk', async (req, res) => {
  try {
    const { records } = req.body; // array of timesheet records
    const created = await HostelTimesheet.insertMany(records);
    res.status(201).json({ created: created.length });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const rec = await HostelTimesheet.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!rec) return res.status(404).json({ message: 'Not found' });
    res.json(rec);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await HostelTimesheet.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
