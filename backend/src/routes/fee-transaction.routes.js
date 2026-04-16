const express = require('express');
const router = express.Router();
const FeeTransaction = require('../models/fee-transaction.model');

router.get('/stats', async (req, res) => {
  try {
    const stats = await FeeTransaction.aggregate([
      { $group: { _id: '$pay_status', count: { $sum: 1 }, total: { $sum: '$pay_amount' } } },
    ]);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.pay_status) filter.pay_status = req.query.pay_status;
    if (req.query.fee_category) filter.fee_category = req.query.fee_category;
    if (req.query.module_name) filter.module_name = req.query.module_name;
    if (req.query.start || req.query.end) {
      filter.captured_date = {};
      if (req.query.start) filter.captured_date.$gte = new Date(req.query.start);
      if (req.query.end) filter.captured_date.$lte = new Date(req.query.end);
    }
    // Filter by comma-separated order_ids
    if (req.query.order_ids) {
      const mongoose = require('mongoose');
      const ids = req.query.order_ids.split(',').map((id) => {
        try { return new mongoose.Types.ObjectId(id.trim()); } catch { return null; }
      }).filter(Boolean);
      if (ids.length) filter.order_id = { $in: ids };
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      FeeTransaction.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit),
      FeeTransaction.countDocuments(filter),
    ]);
    res.json({ success: true, data, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const doc = new FeeTransaction(req.body);
    await doc.save();
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const doc = await FeeTransaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /bulk-upload — bulk upload payments via JSON rows
router.post('/bulk-upload', async (req, res) => {
  try {
    const rows = req.body.rows || [];
    const Student = require('../models/student.model');
    const FeeOrder = require('../models/fee-order.model');

    let created = 0;
    const errors = [];

    const VALID_METHODS = ['DD', 'PO', 'CHEQUE', 'CASH', 'RTGS / NEFT', 'BOOK ADJUSTMENT'];

    for (const row of rows) {
      try {
        const method = (row.method || 'CASH').toUpperCase();
        if (!VALID_METHODS.includes(method) && !VALID_METHODS.map(m => m.replace(' ', '')).includes(method)) {
          errors.push({ usn: row.usn, error: `Invalid method: ${row.method}` });
          continue;
        }

        const student = await Student.findOne({ student_id: row.usn }).lean();
        const order = row.order_id ? await FeeOrder.findOne({ order_id: row.order_id }).lean() : null;

        const tx = new FeeTransaction({
          fee_category: row.fee_category || 'General',
          pay_amount: parseFloat(row.pay_amount) || 0,
          pay_status: 'captured',
          method: row.method || 'CASH',
          mode: 'offline',
          order_custom_id: row.order_id || '',
          order_id: order ? order._id : undefined,
          student_id: student ? student._id : undefined,
          student_name: row.student_name || (student ? student.fullName : row.usn),
          usn: row.usn,
          captured_date: row.date ? new Date(row.date) : new Date(),
          offline_ref: row.ref_no || '',
          description: row.description || '',
          entity: 'fee_transaction',
        });
        await tx.save();

        // Update order paid amount if order found
        if (order) {
          const newPaid = (order.fee_paid_amount || 0) + tx.pay_amount;
          const newDue = Math.max(0, (order.fee_order_amount || 0) - newPaid);
          const newStatus = newDue === 0 ? 'paid' : newPaid > 0 ? 'partial' : 'created';
          await FeeOrder.findByIdAndUpdate(order._id, {
            fee_paid_amount: newPaid,
            fee_due_amount: newDue,
            order_status: newStatus,
            $inc: { attempts: 1 },
          });
        }

        created++;
      } catch (e) {
        errors.push({ usn: row.usn, error: e.message });
      }
    }

    res.json({ success: true, data: { created, errors } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
