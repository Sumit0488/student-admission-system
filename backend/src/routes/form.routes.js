'use strict';
const express = require('express');
const { getTenantFilter } = require('../utils/tenantFilter');
const router = express.Router();
const Form = require('../models/form.model');

router.get('/', async (req, res) => {
  try {
    const tf = getTenantFilter(req.tenantId);
    const filter = { ...tf };
    if (req.query.status) filter.status = req.query.status;
    const data = await Form.find(filter).sort({ created_at: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await Form.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const createdBy = req.user?.name || req.user?.email || 'Admin';
    const doc = new Form({
      ...req.body,
      created_by: req.body.created_by || createdBy,
      ...(req.tenantId && { tenantId: req.tenantId }),
    });
    await doc.save();
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const doc = await Form.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const doc = await Form.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
