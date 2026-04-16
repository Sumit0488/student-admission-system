const mongoose = require('mongoose');

const generateOrderId = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
};

const feeOrderSchema = new mongoose.Schema(
  {
    institution_id: { type: String, trim: true },
    order_id: { type: String, unique: true, default: generateOrderId },
    entity: { type: String, required: true, trim: true, default: 'fee_order' },
    fee_schedule_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeSchedule' },
    academic_year: { type: String, trim: true },
    fee_category: { type: String, required: true, trim: true },
    fee_type: { type: String, enum: ['GENERAL', 'EXAM', 'REVAL'], default: 'GENERAL' },
    term: { type: Number },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    user_email: { type: String, trim: true },
    student_name: { type: String, trim: true },
    usn: { type: String, trim: true },
    fee_particulars: [
      {
        fee_head: { type: String, trim: true },
        fee_head_priority: { type: Number },
        fee_head_amount: { type: Number, default: 0 },
        fee_head_paid: { type: Number, default: 0 },
        fee_head_due: { type: Number, default: 0 },
        fee_head_discount: { type: Number, default: 0 },
        fee_head_status: { type: String, default: 'pending' },
      },
    ],
    fee_order_amount: { type: Number, default: 0 },
    description: { type: String, trim: true, default: '' },
    fee_paid_amount: { type: Number, default: 0 },
    fee_due_amount: { type: Number, default: 0 },
    fee_discount: { type: Number, default: 0 },
    order_status: { type: String, default: 'created' },
    attempts: { type: Number, default: 0 },
    year_of_study: { type: Number },
    stream_id: { type: String, trim: true },
    notes: { type: String, trim: true, default: '' },
    module_name: { type: String, trim: true, default: 'Fee' },
    app_type: {
      type: String,
      enum: ['Admin', 'Exam', 'Student', 'Hrtech', 'Academics'],
      default: 'Admin',
    },
    customer_crm_id: { type: String, trim: true },
    program: { type: String, trim: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const FeeOrder = mongoose.model('FeeOrder', feeOrderSchema);
module.exports = FeeOrder;
