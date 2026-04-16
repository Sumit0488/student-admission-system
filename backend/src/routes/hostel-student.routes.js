const express = require('express');
const { getTenantFilter } = require('../utils/tenantFilter');
const router = express.Router();
const HostelStudent = require('../models/hostel-student.model');
const FeeOrder = require('../models/fee-order.model');
const FeeTransaction = require('../models/fee-transaction.model');
const ActivityLog = require('../models/activity-log.model');

const log = (action, label, data, req) =>
  ActivityLog.create({
    module: 'Hostel', action, action_label: label,
    performed_by: req?.user?.name || req?.user?.email || 'Admin',
    ip: req?.ip,
    ...data,
  }).catch(() => {});

// GET /api/hostel/stats
router.get('/stats', async (req, res) => {
  try {
    const [total, active, feeResult] = await Promise.all([
      HostelStudent.countDocuments({}),
      HostelStudent.countDocuments({ status: 'Active' }),
      HostelStudent.aggregate([{ $group: { _id: null, total: { $sum: '$fee_paid' } } }]),
    ]);
    res.json({ success: true, data: { total, active, feeCollected: feeResult[0]?.total || 0 } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/hostel/students
router.get('/', async (req, res) => {
  try {
    const tf = getTenantFilter(req.tenantId);
    const filter = { ...tf };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.hostel_name) filter.hostel_name = req.query.hostel_name;
    if (req.query.program) filter.program = req.query.program;
    if (req.query.gender) filter.gender = req.query.gender;
    if (req.query.q) {
      const re = new RegExp(req.query.q, 'i');
      filter.$or = [{ name: re }, { usn: re }, { mobile_number: re }, { hostel_id: re }, { room_number: re }];
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      HostelStudent.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit),
      HostelStudent.countDocuments(filter),
    ]);
    res.json({ success: true, data, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/hostel/students/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await HostelStudent.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/hostel/students
router.post('/', async (req, res) => {
  try {
    const doc = new HostelStudent({ ...req.body, ...(req.tenantId && { tenantId: req.tenantId }) });
    await doc.save();
    log('member_added', 'Resident Added', { entity_id: doc.hostel_id, entity_label: doc.name, student_name: doc.name, usn: doc.usn, details: `Admitted to ${doc.hostel_name || 'hostel'}, Room ${doc.room_number || '—'}` }, req);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/hostel/students/:id
router.put('/:id', async (req, res) => {
  try {
    const doc = await HostelStudent.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    log('member_updated', 'Resident Updated', { entity_id: doc.hostel_id, entity_label: doc.name, student_name: doc.name, usn: doc.usn }, req);
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/hostel/students/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await HostelStudent.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    log('member_deleted', 'Resident Deleted', { entity_id: doc.hostel_id, entity_label: doc.name, student_name: doc.name, usn: doc.usn }, req);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/hostel/students/:id/collect — collect hostel fee
router.post('/:id/collect', async (req, res) => {
  try {
    const resident = await HostelStudent.findById(req.params.id);
    if (!resident) return res.status(404).json({ success: false, error: 'Resident not found' });

    const { amount, method, reference, date, description, fee_category } = req.body;
    const payAmount = parseFloat(amount);
    if (!payAmount || payAmount <= 0) return res.status(400).json({ success: false, error: 'Invalid amount' });

    // Create fee order for hostel
    const order = new FeeOrder({
      fee_category: fee_category || 'Hostel Fee',
      fee_type: 'GENERAL',
      module_name: 'Hostel',
      student_name: resident.name,
      usn: resident.usn,
      fee_order_amount: payAmount,
      fee_paid_amount: payAmount,
      fee_due_amount: 0,
      order_status: 'paid',
      attempts: 1,
    });
    await order.save();

    // Create transaction
    const tx = new FeeTransaction({
      fee_category: fee_category || 'Hostel Fee',
      module_name: 'Hostel',
      pay_amount: payAmount,
      pay_status: 'captured',
      method: method || 'Cash',
      mode: 'offline',
      order_id: order._id,
      order_custom_id: order.order_id,
      student_name: resident.name,
      usn: resident.usn,
      captured_date: date ? new Date(date) : new Date(),
      offline_ref: reference || '',
      description: description || '',
      entity: 'fee_transaction',
    });
    await tx.save();

    // Update resident fee_paid
    await HostelStudent.findByIdAndUpdate(resident._id, { $inc: { fee_paid: payAmount } });

    log('fee_collected', 'Fee Collected', {
      entity_id: resident.hostel_id, entity_label: resident.name,
      student_name: resident.name, usn: resident.usn,
      amount: payAmount,
      details: `₹${payAmount} collected via ${method || 'Cash'} (${fee_category || 'Hostel Fee'})`,
    }, req);

    res.json({ success: true, data: { transaction: tx, order } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
