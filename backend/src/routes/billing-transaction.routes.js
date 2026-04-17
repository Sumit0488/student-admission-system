const express = require('express');
const { getTenantFilter } = require('../utils/tenantFilter');
const router = express.Router();
const BillingTransaction = require('../models/billing-transaction.model');
const BillingCustomer = require('../models/billing-customer.model');
const BillingOrder = require('../models/billing-order.model');
const logActivity = require('../utils/logActivity');

router.get('/', async (req, res) => {
  try {
    const tf = getTenantFilter(req.tenantId);
    const filter = { ...tf };
    if (req.query.pay_status) filter.pay_status = req.query.pay_status;
    if (req.query.customer_id) filter.customer_id = req.query.customer_id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [rawData, total] = await Promise.all([
      BillingTransaction.find(filter)
        .populate('order_id', 'order_id customer_id customer_name')
        .sort({ created_at: -1 }).skip(skip).limit(limit),
      BillingTransaction.countDocuments(filter),
    ]);

    // Collect customer names that still lack a customer_id for batch lookup
    const missingNames = [...new Set(
      rawData
        .filter((t) => !t.customer_id && t.customer_name)
        .map((t) => t.customer_name)
    )];

    const customerMap = {};
    if (missingNames.length) {
      const tf = getTenantFilter(req.tenantId);
      const customers = await BillingCustomer.find({ ...tf, name: { $in: missingNames } }).lean();
      customers.forEach((c) => { customerMap[c.name] = c.customer_id; });
    }

    const data = rawData.map((t) => {
      const obj = t.toObject();
      const order = obj.order_id;
      if (order && typeof order === 'object') {
        if (!obj.order_custom_id) obj.order_custom_id = order.order_id;
        if (!obj.customer_id) obj.customer_id = order.customer_id;
        if (!obj.customer_name) obj.customer_name = order.customer_name;
        obj.order_id = order._id;
      }
      // Fallback: resolve customer_id from BillingCustomer by name
      if (!obj.customer_id && obj.customer_name && customerMap[obj.customer_name]) {
        obj.customer_id = customerMap[obj.customer_name];
      }
      return obj;
    });

    // Batch-lookup BillingOrder for transactions still missing order_custom_id or fee_category
    const needsOrder = data.filter((t) => !t.order_custom_id || !t.fee_category);
    if (needsOrder.length) {
      const tf2 = getTenantFilter(req.tenantId);
      const cids   = [...new Set(needsOrder.map((t) => t.customer_id).filter(Boolean))];
      const cnames = [...new Set(needsOrder.map((t) => t.customer_name).filter(Boolean))];

      const orQuery = [];
      if (cids.length)   orQuery.push({ customer_id: { $in: cids } });
      if (cnames.length) orQuery.push({ customer_name: { $in: cnames } });

      if (orQuery.length) {
        const orders = await BillingOrder.find({ ...tf2, $or: orQuery })
          .sort({ created_at: -1 })
          .select('customer_id customer_name order_id fee_category')
          .lean();

        // Build lookup maps by customer_id and customer_name (latest order wins)
        const byId = {}, byName = {};
        orders.forEach((o) => {
          if (o.customer_id && !byId[o.customer_id])   byId[o.customer_id]   = o;
          if (o.customer_name && !byName[o.customer_name]) byName[o.customer_name] = o;
        });

        data.forEach((t) => {
          const o = (t.customer_id && byId[t.customer_id]) || (t.customer_name && byName[t.customer_name]);
          if (!o) return;
          if (!t.order_custom_id) t.order_custom_id = o.order_id;
          if (!t.fee_category)    t.fee_category    = o.fee_category;
        });
      }
    }

    res.json({ success: true, data, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const bodyData = { ...req.body };

    // Auto-fill customer_id and order_custom_id from linked BillingOrder
    if (bodyData.order_id && (!bodyData.customer_id || !bodyData.order_custom_id)) {
      if (mongoose.Types.ObjectId.isValid(bodyData.order_id)) {
        const order = await BillingOrder.findById(bodyData.order_id).lean();
        if (order) {
          if (!bodyData.order_custom_id) bodyData.order_custom_id = order.order_id;
          if (!bodyData.customer_id) bodyData.customer_id = order.customer_id;
          if (!bodyData.customer_name) bodyData.customer_name = order.customer_name;
        }
      }
    }

    const doc = new BillingTransaction({ ...bodyData, ...(req.tenantId && { tenantId: req.tenantId }) });
    await doc.save();
    logActivity({
      module: 'Billing', action: 'transaction_created', label: 'Transaction Created',
      entityId: doc.payment_id || String(doc._id), entityLabel: doc.customer_name,
      studentName: doc.customer_name, amount: doc.pay_amount,
      details: `₹${doc.pay_amount} via ${doc.method || 'CASH'} — receipt ${doc.receipt_no || '—'}`,
      req,
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const doc = await BillingTransaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    logActivity({
      module: 'Billing', action: 'transaction_updated', label: 'Transaction Updated',
      entityId: doc.payment_id || String(doc._id), entityLabel: doc.customer_name,
      studentName: doc.customer_name, amount: doc.pay_amount,
      details: `Transaction ${doc.payment_id || doc._id} updated`,
      req,
    });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
