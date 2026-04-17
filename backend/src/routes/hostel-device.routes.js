const express = require('express');
const { getTenantFilter } = require('../utils/tenantFilter');
const router = express.Router();
const HostelDevice = require('../models/hostel-device.model');
const ActivityLog = require('../models/activity-log.model');

const log = (action, label, data, req) =>
  ActivityLog.create({
    module: 'Hostel', action, action_label: label,
    performed_by: req?.user?.name || req?.user?.email || 'Admin',
    ip: req?.ip, tenantId: req?.tenantId || null,
    ...data,
  }).catch(() => {});

router.get('/', async (req, res) => {
  try {
    const { q, status, device_type, hostel_name, page = 1, limit = 20 } = req.query;
    const tf = getTenantFilter(req.tenantId);
    const filter = { ...tf };
    if (status) filter.status = status;
    if (device_type) filter.device_type = device_type;
    if (hostel_name) filter.hostel_name = new RegExp(hostel_name, 'i');
    if (q) {
      const re = new RegExp(q, 'i');
      filter.$or = [{ device_name: re }, { device_id: re }, { serial_number: re }, { student_name: re }, { usn: re }];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      HostelDevice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      HostelDevice.countDocuments(filter),
    ]);
    res.json({ data, total, page: Number(page) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const rec = await HostelDevice.findById(req.params.id);
    if (!rec) return res.status(404).json({ message: 'Not found' });
    res.json(rec);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const rec = await HostelDevice.create(req.body);
    log('device_added', 'Device Added', { entity_id: rec.device_id, entity_label: rec.device_name, student_name: rec.student_name, usn: rec.usn, details: `${rec.device_type} device registered` }, req);
    res.status(201).json(rec);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const rec = await HostelDevice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!rec) return res.status(404).json({ message: 'Not found' });
    log('device_updated', 'Device Updated', { entity_id: rec.device_id, entity_label: rec.device_name, student_name: rec.student_name, details: `Status: ${rec.status}` }, req);
    res.json(rec);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const rec = await HostelDevice.findByIdAndDelete(req.params.id);
    if (!rec) return res.status(404).json({ message: 'Not found' });
    log('device_deleted', 'Device Deleted', { entity_id: rec.device_id, entity_label: rec.device_name }, req);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST assign device to student
router.post('/:id/assign', async (req, res) => {
  try {
    const rec = await HostelDevice.findByIdAndUpdate(
      req.params.id,
      { status: 'Assigned', student_name: req.body.student_name, usn: req.body.usn, hostel_student_ref: req.body.hostel_student_ref, room_number: req.body.room_number, assigned_date: new Date(), return_date: null },
      { new: true }
    );
    log('device_assigned', 'Device Assigned', { entity_id: rec.device_id, entity_label: rec.device_name, student_name: rec.student_name, usn: rec.usn, details: `Assigned to ${rec.student_name} - Room ${rec.room_number}` }, req);
    res.json(rec);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// POST return device
router.post('/:id/return', async (req, res) => {
  try {
    const rec = await HostelDevice.findByIdAndUpdate(
      req.params.id,
      { status: 'Available', return_date: new Date(), condition: req.body.condition || 'Good', remarks: req.body.remarks, student_name: null, usn: null, hostel_student_ref: null },
      { new: true }
    );
    log('device_returned', 'Device Returned', { entity_id: rec.device_id, entity_label: rec.device_name, details: `Returned in ${req.body.condition || 'Good'} condition` }, req);
    res.json(rec);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = router;
