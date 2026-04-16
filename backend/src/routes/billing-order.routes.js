const express = require('express');
const { getTenantFilter } = require('../utils/tenantFilter');
const router = express.Router();
const BillingOrder = require('../models/billing-order.model');
const ActivityLog = require('../models/activity-log.model');

const log = (action, label, data, req) =>
  ActivityLog.create({
    module: 'Billing', action, action_label: label,
    performed_by: req?.user?.name || req?.user?.email || 'Admin',
    ip: req?.ip,
    ...data,
  }).catch(() => {});

// GET /api/billing/orders/stats
router.get('/stats', async (req, res) => {
  try {
    const [total, paidResult, pendingCount] = await Promise.all([
      BillingOrder.countDocuments({}),
      BillingOrder.aggregate([
        { $match: { order_status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$fee_order_amount' } } },
      ]),
      BillingOrder.countDocuments({ order_status: { $ne: 'paid' } }),
    ]);
    res.json({ success: true, data: { total, collected: paidResult[0]?.total || 0, pending: pendingCount } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const tf = getTenantFilter(req.tenantId);
    const filter = { ...tf };
    if (req.query.status) filter.order_status = req.query.status;
    if (req.query.customer_id) filter.customer_id = req.query.customer_id;
    if (req.query.academic_year) filter.academic_year = req.query.academic_year;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      BillingOrder.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit),
      BillingOrder.countDocuments(filter),
    ]);
    res.json({ success: true, data, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await BillingOrder.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const doc = new BillingOrder({ ...req.body, ...(req.tenantId && { tenantId: req.tenantId }) });
    await doc.save();
    log('order_created', 'Order Created', { entity_id: doc.order_id, entity_label: doc.customer_name, student_name: doc.customer_name, amount: doc.fee_order_amount, details: `${doc.fee_category} — ₹${doc.fee_order_amount}` }, req);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const doc = await BillingOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    log('order_updated', 'Order Updated', { entity_id: doc.order_id, entity_label: doc.customer_name, student_name: doc.customer_name, amount: doc.fee_order_amount }, req);
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
