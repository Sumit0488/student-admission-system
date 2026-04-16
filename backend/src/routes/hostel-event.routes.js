const express = require('express');
const { getTenantFilter } = require('../utils/tenantFilter');
const router = express.Router();
const HostelEvent = require('../models/hostel-event.model');
const ActivityLog = require('../models/activity-log.model');

const log = (action, label, data) =>
  ActivityLog.create({ module: 'Hostel', action, action_label: label, ...data }).catch(() => {});

router.get('/', async (req, res) => {
  try {
    const { q, status, event_type, hostel_name, page = 1, limit = 20 } = req.query;
    const tf = getTenantFilter(req.tenantId);
    const filter = { ...tf };
    if (status) filter.status = status;
    if (event_type) filter.event_type = event_type;
    if (hostel_name) filter.hostel_name = new RegExp(hostel_name, 'i');
    if (q) {
      const re = new RegExp(q, 'i');
      filter.$or = [{ title: re }, { organizer: re }, { venue: re }, { event_id: re }];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      HostelEvent.find(filter).sort({ event_date: -1 }).skip(skip).limit(Number(limit)),
      HostelEvent.countDocuments(filter),
    ]);
    res.json({ data, total, page: Number(page) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const rec = await HostelEvent.findById(req.params.id);
    if (!rec) return res.status(404).json({ message: 'Not found' });
    res.json(rec);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const rec = await HostelEvent.create(req.body);
    log('event_created', 'Event Created', { entity_id: rec.event_id, entity_label: rec.title, details: `${rec.event_type} event created` });
    res.status(201).json(rec);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const rec = await HostelEvent.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!rec) return res.status(404).json({ message: 'Not found' });
    log('event_updated', 'Event Updated', { entity_id: rec.event_id, entity_label: rec.title });
    res.json(rec);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const rec = await HostelEvent.findByIdAndDelete(req.params.id);
    if (!rec) return res.status(404).json({ message: 'Not found' });
    log('event_deleted', 'Event Deleted', { entity_id: rec.event_id, entity_label: rec.title });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
