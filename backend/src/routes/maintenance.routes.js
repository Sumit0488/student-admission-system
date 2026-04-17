'use strict';
const express = require('express');
const router = express.Router();
const { requireAuth, adminOrAbove } = require('../middleware/auth');

// POST /api/maintenance/backfill-receipts
// Backfills receipt_no into BillingTransactions and ref_no into PayRecords that are missing them.
router.post('/backfill-receipts', requireAuth, adminOrAbove, async (req, res) => {
  try {
    const BillingTransaction = require('../models/billing-transaction.model');
    const PayRecord = require('../models/pay-record.model');
    const mongoose = require('mongoose');

    // Backfill BillingTransaction.receipt_no
    const txnResult = await BillingTransaction.updateMany(
      { $or: [{ receipt_no: { $exists: false } }, { receipt_no: '' }, { receipt_no: null }] },
      [{ $set: { receipt_no: { $concat: ['REC-', { $toString: '$_id' }] } } }]
    );

    // Backfill PayRecord.ref_no
    const payResult = await PayRecord.updateMany(
      { $or: [{ ref_no: { $exists: false } }, { ref_no: '' }, { ref_no: null }] },
      [{ $set: { ref_no: { $concat: ['REF-', { $toString: '$_id' }] } } }]
    );

    res.json({
      success: true,
      data: {
        transactions_updated: txnResult.modifiedCount,
        pay_records_updated: payResult.modifiedCount,
      },
      message: `Backfill complete: ${txnResult.modifiedCount} transactions, ${payResult.modifiedCount} pay records updated.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/maintenance/backfill-billing-order-refs
// For BillingTransactions missing customer_id or order_custom_id, look up the linked BillingOrder and copy those fields.
router.post('/backfill-billing-order-refs', requireAuth, adminOrAbove, async (req, res) => {
  try {
    const BillingTransaction = require('../models/billing-transaction.model');
    const BillingOrder = require('../models/billing-order.model');

    const txns = await BillingTransaction.find({
      order_id: { $exists: true, $ne: null },
      $or: [
        { customer_id: { $in: [null, '', undefined] } },
        { order_custom_id: { $in: [null, '', undefined] } },
      ],
    }).lean();

    let updated = 0;
    for (const txn of txns) {
      const order = await BillingOrder.findById(txn.order_id).lean();
      if (!order) continue;
      await BillingTransaction.updateOne(
        { _id: txn._id },
        {
          $set: {
            customer_id: txn.customer_id || order.customer_id || '',
            customer_name: txn.customer_name || order.customer_name || '',
            order_custom_id: txn.order_custom_id || order.order_id || '',
            fee_category: txn.fee_category || order.fee_category || '',
          },
        }
      );
      updated++;
    }

    res.json({ success: true, data: { updated }, message: `Backfill complete: ${updated} transactions updated.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/maintenance/stats — count records missing receipt/ref numbers
router.get('/stats', requireAuth, adminOrAbove, async (req, res) => {
  try {
    const BillingTransaction = require('../models/billing-transaction.model');
    const PayRecord = require('../models/pay-record.model');

    const [txnMissing, payMissing] = await Promise.all([
      BillingTransaction.countDocuments({
        $or: [{ receipt_no: { $exists: false } }, { receipt_no: '' }, { receipt_no: null }]
      }),
      PayRecord.countDocuments({
        $or: [{ ref_no: { $exists: false } }, { ref_no: '' }, { ref_no: null }]
      }),
    ]);

    res.json({
      success: true,
      data: { transactions_missing_receipt: txnMissing, pay_records_missing_ref: payMissing },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
