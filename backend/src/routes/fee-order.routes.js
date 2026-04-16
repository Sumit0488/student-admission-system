const express = require('express');
const router = express.Router();
const FeeOrder = require('../models/fee-order.model');

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.order_status = req.query.status;
    if (req.query.student_id) {
      try {
        filter.student_id = new (require('mongoose').Types.ObjectId)(req.query.student_id);
      } catch { filter.student_id = req.query.student_id; }
    }
    if (req.query.academic_year) filter.academic_year = req.query.academic_year;
    if (req.query.fee_category) filter.fee_category = req.query.fee_category;
    if (req.query.fee_schedule_id) {
      filter.fee_schedule_id = new (require('mongoose').Types.ObjectId)(req.query.fee_schedule_id);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 500;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      FeeOrder.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit),
      FeeOrder.countDocuments(filter),
    ]);
    res.json({ success: true, data, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await FeeOrder.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const doc = new FeeOrder(req.body);
    await doc.save();
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const doc = await FeeOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/fee/orders/:id/collect — collect a payment against an order
router.post('/:id/collect', async (req, res) => {
  try {
    const FeeTransaction = require('../models/fee-transaction.model');
    const order = await FeeOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const { amount, method, reference, date, remarks } = req.body;
    const payAmount = parseFloat(amount);
    if (!payAmount || payAmount <= 0) return res.status(400).json({ success: false, error: 'Invalid amount' });

    // Create transaction
    const tx = new FeeTransaction({
      fee_category: order.fee_category,
      pay_amount: payAmount,
      pay_status: 'captured',
      method: method || 'Cash',
      mode: 'offline',
      order_id: order._id,
      order_custom_id: order.order_id,
      student_id: order.student_id,
      student_name: order.student_name,
      usn: order.usn,
      captured_date: date ? new Date(date) : new Date(),
      offline_ref: reference || '',
      description: remarks || '',
      entity: 'fee_transaction',
    });
    await tx.save();

    // Update order
    const newPaid = (order.fee_paid_amount || 0) + payAmount;
    const newDue = Math.max(0, (order.fee_order_amount || 0) - newPaid);
    const newStatus = newDue === 0 ? 'paid' : newPaid > 0 ? 'partial' : 'created';
    const updatedOrder = await FeeOrder.findByIdAndUpdate(
      order._id,
      { fee_paid_amount: newPaid, fee_due_amount: newDue, order_status: newStatus, $inc: { attempts: 1 } },
      { new: true }
    );

    res.json({ success: true, data: { transaction: tx, order: updatedOrder } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
