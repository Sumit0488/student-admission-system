const mongoose = require('mongoose');

const feeHeadSchema = new mongoose.Schema(
  {
    institution_id: { type: String, trim: true },
    fee_category: { type: String, trim: true },
    fee_head: { type: String, required: true, trim: true },
    fee_priority: { type: Number, default: 1 },
    fee_description: { type: String, trim: true, default: '' },
    fee_nature: { type: String, trim: true, default: '' },
    fee_head_status: { type: Boolean, default: true },
    module_name: { type: String, enum: ['Fee', 'Billing', 'Exam', 'Library'], default: 'Fee' },
    app_type: { type: String, enum: ['Admin', 'Exam', 'Student'], default: 'Admin' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const FeeHead = mongoose.model('FeeHead', feeHeadSchema);
module.exports = FeeHead;
