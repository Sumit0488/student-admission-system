const express = require('express');
const router = express.Router();
const Stream = require('../models/stream.model');
const asyncWrapper = require('../utils/asyncWrapper');

// GET all streams
router.get('/', asyncWrapper(async (req, res) => {
  const filter = req.tenantId ? { tenantId: req.tenantId } : {};
  const streams = await Stream.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: streams });
}));

// GET single stream
router.get('/:id', asyncWrapper(async (req, res) => {
  const stream = await Stream.findById(req.params.id);
  if (!stream) return res.status(404).json({ success: false, error: 'Stream not found' });
  res.json({ success: true, data: stream });
}));

// POST create stream
router.post('/', asyncWrapper(async (req, res) => {
  const stream = await Stream.create({ ...req.body, tenantId: req.tenantId || 'default' });
  res.status(201).json({ success: true, data: stream });
}));

// PUT update stream
router.put('/:id', asyncWrapper(async (req, res) => {
  const stream = await Stream.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: false });
  if (!stream) return res.status(404).json({ success: false, error: 'Stream not found' });
  res.json({ success: true, data: stream });
}));

// DELETE stream
router.delete('/:id', asyncWrapper(async (req, res) => {
  await Stream.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Deleted' });
}));

module.exports = router;
