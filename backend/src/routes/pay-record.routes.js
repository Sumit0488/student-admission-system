const express = require('express');
const router = express.Router();
const PayRecord = require('../models/pay-record.model');

router.get('/', async (req, res) => {
  try {
    const filter = { module_name: { $ne: 'Billing' } };
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
    if (req.query.financial_year) {
      // Filter by year based on transaction_date
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
    const doc = new PayRecord({ ...req.body, module_name: 'Fee' });
    await doc.save();
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const doc = await PayRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const doc = await PayRecord.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
