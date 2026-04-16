const express = require('express');
const { getTenantFilter } = require('../utils/tenantFilter');
const router = express.Router();
const GeneralStudent = require('../models/general-student.model');

router.get('/', async (req, res) => {
  try {
    const tf = getTenantFilter(req.tenantId);
    const filter = { ...tf };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.stream) filter.stream = req.query.stream;
    if (req.query.program) filter.program = req.query.program;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      GeneralStudent.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit),
      GeneralStudent.countDocuments(filter),
    ]);
    res.json({ success: true, data, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const doc = new GeneralStudent({ ...req.body, ...(req.tenantId && { tenantId: req.tenantId }) });
    await doc.save();
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const doc = await GeneralStudent.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const doc = await GeneralStudent.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
