const express = require('express');
const { getTenantFilter } = require('../utils/tenantFilter');
const router = express.Router();
const LibraryMember = require('../models/library-member.model');
const FeeOrder = require('../models/fee-order.model');
const FeeTransaction = require('../models/fee-transaction.model');
const ActivityLog = require('../models/activity-log.model');

const log = (action, label, data, req) =>
  ActivityLog.create({
    module: 'Library', action, action_label: label,
    performed_by: req?.user?.name || req?.user?.email || 'Admin',
    ip: req?.ip,
    ...data,
  }).catch(() => {});

// GET /api/library/stats
router.get('/stats', async (req, res) => {
  try {
    const [total, active, fineResult] = await Promise.all([
      LibraryMember.countDocuments({}),
      LibraryMember.countDocuments({ status: 'Active' }),
      LibraryMember.aggregate([{ $group: { _id: null, total: { $sum: '$fine_paid' } } }]),
    ]);
    res.json({ success: true, data: { total, active, fineCollected: fineResult[0]?.total || 0 } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/library/members
router.get('/', async (req, res) => {
  try {
    const tf = getTenantFilter(req.tenantId);
    const filter = { ...tf };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.membership_type) filter.membership_type = req.query.membership_type;
    if (req.query.program) filter.program = req.query.program;
    if (req.query.q) {
      const re = new RegExp(req.query.q, 'i');
      filter.$or = [{ name: re }, { usn: re }, { mobile_number: re }, { member_id: re }];
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      LibraryMember.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      LibraryMember.countDocuments(filter),
    ]);
    res.json({ success: true, data, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/library/members/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await LibraryMember.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/library/members
router.post('/', async (req, res) => {
  try {
    const doc = new LibraryMember({ ...req.body, ...(req.tenantId && { tenantId: req.tenantId }) });
    await doc.save();
    log('member_added', 'Member Added', { entity_id: doc.member_id, entity_label: doc.name, student_name: doc.name, usn: doc.usn, details: `${doc.membership_type} member added` }, req);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/library/members/:id
router.put('/:id', async (req, res) => {
  try {
    const doc = await LibraryMember.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    log('member_updated', 'Member Updated', { entity_id: doc.member_id, entity_label: doc.name, student_name: doc.name, usn: doc.usn }, req);
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/library/members/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await LibraryMember.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    log('member_deleted', 'Member Deleted', { entity_id: doc.member_id, entity_label: doc.name, student_name: doc.name, usn: doc.usn }, req);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/library/members/:id/collect
router.post('/:id/collect', async (req, res) => {
  try {
    const member = await LibraryMember.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, error: 'Member not found' });

    const { amount, method, reference, date, description, fee_category } = req.body;
    const payAmount = parseFloat(amount);
    if (!payAmount || payAmount <= 0) return res.status(400).json({ success: false, error: 'Invalid amount' });

    const order = new FeeOrder({
      fee_category: fee_category || 'Library Fine',
      fee_type: 'GENERAL',
      module_name: 'Library',
      student_name: member.name,
      usn: member.usn,
      fee_order_amount: payAmount,
      fee_paid_amount: payAmount,
      fee_due_amount: 0,
      order_status: 'paid',
      attempts: 1,
    });
    await order.save();

    const tx = new FeeTransaction({
      fee_category: fee_category || 'Library Fine',
      module_name: 'Library',
      pay_amount: payAmount,
      pay_status: 'captured',
      method: method || 'Cash',
      mode: 'offline',
      order_id: order._id,
      order_custom_id: order.order_id,
      student_name: member.name,
      usn: member.usn,
      captured_date: date ? new Date(date) : new Date(),
      offline_ref: reference || '',
      description: description || '',
      entity: 'fee_transaction',
    });
    await tx.save();

    await LibraryMember.findByIdAndUpdate(member._id, { $inc: { fine_paid: payAmount } });

    log('fine_collected', 'Fine Collected', {
      entity_id: member.member_id, entity_label: member.name,
      student_name: member.name, usn: member.usn,
      amount: payAmount,
      details: `₹${payAmount} collected via ${method || 'Cash'} (${fee_category || 'Library Fine'})`,
    }, req);

    res.json({ success: true, data: { transaction: tx, order } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/library/members/:id/suspend
router.post('/:id/suspend', async (req, res) => {
  try {
    const doc = await LibraryMember.findByIdAndUpdate(req.params.id, { status: 'Suspended' }, { new: true });
    log('member_suspended', 'Member Suspended', { entity_id: doc.member_id, entity_label: doc.name, student_name: doc.name, usn: doc.usn, details: req.body.reason }, req);
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
