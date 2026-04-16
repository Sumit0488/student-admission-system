const mongoose = require('mongoose');

const feeCategorySchema = new mongoose.Schema(
  {
    institution_id: { type: String, trim: true },
    fee_category: { type: String, required: true, trim: true },
    account_type: { type: String, trim: true, default: '' },
    module_name: [{ type: String, enum: ['FEE', 'Billing', 'Library', 'Hostel', 'Alumni', 'Exam'] }],
    fee_type: { type: String, enum: ['GENERAL', 'EXAM', 'REVAL'], default: 'GENERAL' },
    invoice_prefix: { type: String, trim: true, default: '' },
    receipt_prefix: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    stream_id: { type: String, trim: true },
    default_category: { type: Boolean, default: false },
    receipt_generator: { type: Number, default: 1 },
    invoice_generator: { type: Number, default: 1 },
    app_type: { type: String, trim: true, default: 'Admin' },
    created_by: {
      user_email: { type: String, trim: true },
      user_name: { type: String, trim: true },
    },
    updated_by: {
      user_email: { type: String, trim: true },
      user_name: { type: String, trim: true },
    },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
},
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const FeeCategory = mongoose.model('FeeCategory', feeCategorySchema);
module.exports = FeeCategory;
