const mongoose = require('mongoose');

const generatePaymentId = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BPAY-${ts}-${rand}`;
};

const billingTransactionSchema = new mongoose.Schema(
  {
    institution_id: { type: String, trim: true },
    payment_id: { type: String, unique: true, default: generatePaymentId },
    entity: { type: String, required: true, trim: true, default: 'billing_transaction' },
    fee_category: { type: String, trim: true },
    fee_type: { type: String, trim: true },
    pay_amount: { type: Number, required: true },
    pay_status: { type: String, trim: true, default: 'captured' },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'BillingOrder' },
    order_custom_id: { type: String, trim: true },
    receipt_no: { type: String, trim: true },
    customer_id: { type: String, trim: true },
    customer_name: { type: String, trim: true },
    pay_records: [
      {
        fee_head: { type: String, trim: true },
        amount_paid: { type: Number, default: 0 },
      },
    ],
    method: { type: String, trim: true, default: '' },
    mode: { type: String, trim: true, default: 'offline' },
    description: { type: String, trim: true, default: '' },
    amount_refunded: { type: Number, default: 0 },
    refund_status: { type: String, default: 'no' },
    captured_date: { type: Date },
    offline_ref: { type: String, trim: true, default: '' },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    term: { type: Number },
    student_name: { type: String, trim: true },
    usn: { type: String, trim: true },
    user_email: { type: String, trim: true },
    module_name: { type: String, trim: true, default: 'Billing' },
    app_type: { type: String, trim: true, default: 'Admin' },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
},
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const BillingTransaction = mongoose.model('BillingTransaction', billingTransactionSchema);
module.exports = BillingTransaction;
