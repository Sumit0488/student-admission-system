const mongoose = require('mongoose');

const generateRefundId = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `REF-${ts}-${rand}`;
};

const feeRefundSchema = new mongoose.Schema(
  {
    institution_id: { type: String, trim: true },
    refund_id: { type: String, unique: true, default: generateRefundId },
    entity: { type: String, required: true, trim: true, default: 'refund' },
    refund_amount: { type: Number, required: true },
    receipt_no: { type: String, trim: true, default: '' },
    payment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeTransaction' },
    description: { type: String, trim: true, default: '' },
    method: { type: String, trim: true, default: '' },
    offline_ref: { type: String, trim: true, default: '' },
    refund_status: { type: String, default: 'pending' },
    student_id: { type: String, trim: true },
    student_name: { type: String, trim: true },
    usn: { type: String, trim: true },
    user_email: { type: String, trim: true },
    fee_type: { type: String, trim: true },
    module_name: { type: String, trim: true, default: 'Fee' },
    app_type: { type: String, trim: true, default: 'Admin' },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
},
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const FeeRefund = mongoose.model('FeeRefund', feeRefundSchema);
module.exports = FeeRefund;
