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

// POST /api/billing/orders/:id/collect — record a payment against an order
router.post('/:id/collect', async (req, res) => {
  try {
    const BillingTransaction = require('../models/billing-transaction.model');
    const order = await BillingOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const payAmount = parseFloat(req.body.amount) || 0;
    if (payAmount <= 0) return res.status(400).json({ success: false, error: 'Invalid amount' });

    const alreadyPaid = order.fee_paid_amount || 0;
    const orderTotal  = order.fee_order_amount || 0;
    const remaining   = orderTotal - alreadyPaid;

    if (payAmount > remaining + 0.01) {
      return res.status(400).json({ success: false, error: `Amount exceeds remaining balance ₹${remaining}` });
    }

    const receiptNo = `REC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const txn = new BillingTransaction({
      order_id: order._id,
      order_custom_id: order.order_id,
      customer_id: order.customer_id,
      customer_name: order.customer_name,
      fee_category: order.fee_category,
      pay_amount: payAmount,
      method: req.body.method || 'CASH',
      offline_ref: req.body.reference_no || '',
      description: req.body.description || '',
      pay_status: 'captured',
      captured_date: new Date(),
      receipt_no: receiptNo,
      ...(req.tenantId && { tenantId: req.tenantId }),
    });
    await txn.save();

    const newPaid   = alreadyPaid + payAmount;
    const newDue    = Math.max(0, orderTotal - newPaid);
    const newStatus = newDue <= 0.01 ? 'paid' : 'partial';

    order.fee_paid_amount = newPaid;
    order.fee_due_amount  = newDue;
    order.order_status    = newStatus;
    order.attempts        = (order.attempts || 0) + 1;
    await order.save();

    log('payment_collected', 'Payment Collected', {
      entity_id: order.order_id,
      entity_label: order.customer_name,
      student_name: order.customer_name,
      amount: payAmount,
      details: `₹${payAmount} via ${req.body.method || 'CASH'}`,
    }, req);

    res.json({ success: true, data: { order, transaction: txn } });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
