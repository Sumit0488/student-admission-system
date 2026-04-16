const mongoose = require('mongoose');

const feeCategorySchema = new mongoose.Schema(
  {
    institution_id: { type: String, trim: true },
    fee_category: { type: String, required: true, trim: true },
    stream_id: { type: String, trim: true },
    default_category: { type: Boolean, default: false },
    prefix_invoice: { type: String, trim: true, default: '' },
    prefix_receipt: { type: String, trim: true, default: '' },
    receipt_generator: { type: Number, default: 1 },
    invoice_generator: { type: Number, default: 1 },
    status: { type: String, required: true, trim: true, default: 'active' },
    module_name: [{ type: String, enum: ['Fee', 'Billing', 'Exam', 'Library'] }],
    app_type: { type: String, trim: true, default: 'Admin' },
    fee_type: { type: String, enum: ['GENERAL', 'EXAM', 'REVAL'], default: 'GENERAL' },
    created_by: {
      user_email: { type: String, trim: true },
      user_name: { type: String, trim: true },
    },
    updated_by: {
      user_email: { type: String, trim: true },
      user_name: { type: String, trim: true },
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const FeeCategory = mongoose.model('FeeCategory', feeCategorySchema);
module.exports = FeeCategory;
