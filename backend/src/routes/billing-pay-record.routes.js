const express = require('express');
const { getTenantFilter } = require('../utils/tenantFilter');
const router = express.Router();
const PayRecord = require('../models/pay-record.model');
const logActivity = require('../utils/logActivity');

router.get('/', async (req, res) => {
  try {
    const filter = { module_name: 'Billing' };
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
    if (req.query.financial_year) {
      const [startYear] = req.query.financial_year.split('-');
      filter.transaction_date = {
        $gte: new Date(`${startYear}-04-01`),
        $lte: new Date(`${parseInt(startYear) + 1}-03-31`),
      };
    }
    const data = await PayRecord.find(filter).sort({ created_at: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const body = { ...req.body, module_name: 'Billing' };
    // Auto-generate ref_no if not provided
    if (!body.ref_no) {
      body.ref_no = `REF-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    }
    const doc = new PayRecord(body);
    await doc.save();
    logActivity({
      module: 'Billing', action: 'pay_record_created', label: 'Pay Record Created',
      entityId: doc.record_id || String(doc._id), entityLabel: doc.name,
      studentName: doc.name, amount: doc.transaction_amount,
      details: `Pay record ${doc.ref_no} created — ₹${doc.transaction_amount} via ${doc.method || 'Cash'}`,
      req,
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await PayRecord.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const doc = await PayRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    logActivity({
      module: 'Billing', action: 'pay_record_updated', label: 'Pay Record Updated',
      entityId: doc.record_id || String(doc._id), entityLabel: doc.name,
      studentName: doc.name, amount: doc.transaction_amount,
      details: `Pay record ${doc.ref_no} updated`,
      req,
    });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const doc = await PayRecord.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    logActivity({
      module: 'Billing', action: 'pay_record_deleted', label: 'Pay Record Deleted',
      entityId: doc.record_id || String(doc._id), entityLabel: doc.name,
      studentName: doc.name, amount: doc.transaction_amount,
      details: `Pay record ${doc.ref_no} deleted`,
      req,
    });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
