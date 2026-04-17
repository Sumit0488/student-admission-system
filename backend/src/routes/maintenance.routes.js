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
