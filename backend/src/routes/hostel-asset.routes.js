const express = require('express');
const { getTenantFilter } = require('../utils/tenantFilter');
const router = express.Router();
const HostelAsset = require('../models/hostel-asset.model');
const ActivityLog = require('../models/activity-log.model');

const log = (action, label, data) =>
  ActivityLog.create({ module: 'Hostel', action, action_label: label, ...data }).catch(() => {});

// GET all assets
router.get('/', async (req, res) => {
  try {
    const { q, status, hostel_name, item_category, page = 1, limit = 20 } = req.query;
    const tf = getTenantFilter(req.tenantId);
    const filter = { ...tf };
    if (status) filter.status = status;
    if (hostel_name) filter.hostel_name = new RegExp(hostel_name, 'i');
    if (item_category) filter.item_category = item_category;
    if (q) {
      const re = new RegExp(q, 'i');
      filter.$or = [{ student_name: re }, { usn: re }, { item_name: re }, { issue_id: re }];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      HostelAsset.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      HostelAsset.countDocuments(filter),
    ]);
    res.json({ data, total, page: Number(page) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET single
router.get('/:id', async (req, res) => {
  try {
    const rec = await HostelAsset.findById(req.params.id);
    if (!rec) return res.status(404).json({ message: 'Not found' });
    res.json(rec);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST create
router.post('/', async (req, res) => {
  try {
    const rec = await HostelAsset.create(req.body);
    log('asset_issued', 'Asset Issued', { entity_id: rec.issue_id, entity_label: rec.item_name, student_name: rec.student_name, usn: rec.usn, details: `${rec.item_name} issued to ${rec.student_name}` });
    res.status(201).json(rec);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const rec = await HostelAsset.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!rec) return res.status(404).json({ message: 'Not found' });
    const wasReturned = req.body.status === 'Returned' && req.body.actual_return_date;
    if (wasReturned) {
      log('asset_returned', 'Asset Returned', { entity_id: rec.issue_id, entity_label: rec.item_name, student_name: rec.student_name, usn: rec.usn, details: `${rec.item_name} returned by ${rec.student_name}` });
    } else {
      log('asset_updated', 'Asset Updated', { entity_id: rec.issue_id, entity_label: rec.item_name, student_name: rec.student_name, usn: rec.usn });
    }
    res.json(rec);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const rec = await HostelAsset.findByIdAndDelete(req.params.id);
    if (!rec) return res.status(404).json({ message: 'Not found' });
    log('asset_deleted', 'Asset Record Deleted', { entity_id: rec.issue_id, entity_label: rec.item_name, student_name: rec.student_name });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST mark as returned
router.post('/:id/return', async (req, res) => {
  try {
    const rec = await HostelAsset.findByIdAndUpdate(
      req.params.id,
      { status: 'Returned', actual_return_date: new Date(), condition_at_return: req.body.condition || 'Good', remarks: req.body.remarks },
      { new: true }
    );
    log('asset_returned', 'Asset Returned', { entity_id: rec.issue_id, entity_label: rec.item_name, student_name: rec.student_name, usn: rec.usn, details: `Returned in ${req.body.condition || 'Good'} condition` });
    res.json(rec);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = router;
