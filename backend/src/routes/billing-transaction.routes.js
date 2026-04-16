const express = require('express');
const { getTenantFilter } = require('../utils/tenantFilter');
const router = express.Router();
const BillingTransaction = require('../models/billing-transaction.model');

router.get('/', async (req, res) => {
  try {
    const tf = getTenantFilter(req.tenantId);
    const filter = { ...tf };
    if (req.query.pay_status) filter.pay_status = req.query.pay_status;
    if (req.query.customer_id) filter.customer_id = req.query.customer_id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      BillingTransaction.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit),
      BillingTransaction.countDocuments(filter),
    ]);
    res.json({ success: true, data, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const doc = new BillingTransaction({ ...req.body, ...(req.tenantId && { tenantId: req.tenantId }) });
    await doc.save();
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const doc = await BillingTransaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
