'use strict';
const express = require('express');
const router  = express.Router();
const Batch   = require('../models/batch.model');

const tf = (tenantId) => tenantId ? { tenantId: { $in: [tenantId, null] } } : {};

// GET /api/batches?stream_code=BE
router.get('/', async (req, res) => {
  try {
    const filter = { ...tf(req.tenantId) };
    if (req.query.stream_code) filter.stream_code = req.query.stream_code;
    if (req.query.status) filter.status = req.query.status;
    const batches = await Batch.find(filter).sort({ start_year: -1, batch_name: 1 });
    res.json({ success: true, data: batches });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/batches/:id
router.get('/:id', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });
    res.json({ success: true, data: batch });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/batches
router.post('/', async (req, res) => {
  try {
    const { batch_name, stream_code, stream_name, stream_id, start_year, end_year, terms } = req.body;
    if (!batch_name?.trim() || !stream_code?.trim() || !start_year)
      return res.status(400).json({ success: false, error: 'batch_name, stream_code and start_year are required' });

    const batch = await Batch.create({
      batch_name: batch_name.trim(),
      stream_code: stream_code.trim(),
      stream_name: stream_name || '',
      stream_id: stream_id || null,
      start_year: parseInt(start_year),
      end_year: end_year ? parseInt(end_year) : null,
      terms: terms || [],
      tenantId: req.tenantId || null,
      status: 'active',
    });
    res.status(201).json({ success: true, data: batch });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/batches/:id
router.put('/:id', async (req, res) => {
  try {
    const allowed = ['batch_name', 'stream_name', 'start_year', 'end_year', 'status', 'terms'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    const batch = await Batch.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });
    res.json({ success: true, data: batch });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH /api/batches/:id/toggle — toggle active/inactive
router.patch('/:id/toggle', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });
    batch.status = batch.status === 'active' ? 'inactive' : 'active';
    await batch.save();
    res.json({ success: true, data: batch, message: `Batch ${batch.status}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/batches/:id
router.delete('/:id', async (req, res) => {
  try {
    await Batch.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Batch deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
