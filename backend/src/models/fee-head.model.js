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
    module_name: { type: String, enum: ['Fee', 'Billing', 'Exam', 'Library', 'Hostel', 'Alumni'], default: 'Fee' },
    app_type: { type: String, enum: ['Admin', 'Exam', 'Student'], default: 'Admin' },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
},
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const FeeHead = mongoose.model('FeeHead', feeHeadSchema);
module.exports = FeeHead;
