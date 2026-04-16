const express = require('express');
const router = express.Router();
const AcademicProgram = require('../models/academic-program.model');
const asyncWrapper = require('../utils/asyncWrapper');

// GET all programs (optionally filter by stream_code)
router.get('/', asyncWrapper(async (req, res) => {
  const filter = req.tenantId ? { tenantId: req.tenantId } : {};
  if (req.query.stream_code) filter.stream_code = req.query.stream_code;
  const programs = await AcademicProgram.find(filter).sort({ program_name: 1 });
  res.json({ success: true, data: programs });
}));

// POST create program
router.post('/', asyncWrapper(async (req, res) => {
  const program = await AcademicProgram.create({ ...req.body, tenantId: req.tenantId || 'default' });
  res.status(201).json({ success: true, data: program });
}));

// PUT update program
router.put('/:id', asyncWrapper(async (req, res) => {
  const program = await AcademicProgram.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
  if (!program) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, data: program });
}));

// DELETE program
router.delete('/:id', asyncWrapper(async (req, res) => {
  await AcademicProgram.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Deleted' });
}));

module.exports = router;
