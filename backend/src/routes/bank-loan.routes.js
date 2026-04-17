'use strict';
const express = require('express');
const { getTenantFilter } = require('../utils/tenantFilter');
const router = express.Router();
const BankLoan = require('../models/bank-loan.model');
const ActivityLog = require('../models/activity-log.model');

const log = (action, label, data, req) =>
  ActivityLog.create({
    module: 'General', action, action_label: label,
    performed_by: req?.user?.name || req?.user?.email || 'Admin',
    ip: req?.ip,
    ...data,
  }).catch(() => {});

router.get('/', async (req, res) => {
  try {
    const tf = getTenantFilter(req.tenantId);
    const filter = { ...tf };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.student_id) filter.student_id = req.query.student_id;
    const data = await BankLoan.find(filter).sort({ created_at: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const doc = new BankLoan({ ...req.body, ...(req.tenantId && { tenantId: req.tenantId }) });
    await doc.save();
    log('loan_created', 'Bank Loan Created', {
      entity_id: doc.reference_number || String(doc._id),
      entity_label: doc.student_name,
      student_name: doc.student_name,
      amount: doc.amount,
      details: `Bank loan created for ${doc.student_name} — ${doc.bank_name}`,
      ...(req.tenantId && { tenantId: req.tenantId }),
    }, req);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const doc = await BankLoan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    log('loan_updated', 'Bank Loan Updated', {
      entity_id: doc.reference_number || String(doc._id),
      entity_label: doc.student_name,
      student_name: doc.student_name,
      amount: doc.amount,
      details: `Bank loan for ${doc.student_name} updated — status: ${doc.status}`,
      ...(req.tenantId && { tenantId: req.tenantId }),
    }, req);
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const doc = await BankLoan.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    log('loan_deleted', 'Bank Loan Deleted', {
      entity_id: doc.reference_number || String(doc._id),
      entity_label: doc.student_name,
      student_name: doc.student_name,
      details: `Bank loan for ${doc.student_name} deleted`,
      ...(req.tenantId && { tenantId: req.tenantId }),
    }, req);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
