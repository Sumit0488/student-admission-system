const mongoose = require('mongoose');

const generateCustomerId = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CUS-${ts}-${rand}`;
};

const billingCustomerSchema = new mongoose.Schema(
  {
    institution_id: { type: String, trim: true },
    customer_id: { type: String, unique: true, default: generateCustomerId },
    name: { type: String, required: true, trim: true },
    mobile_number: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    stream: { type: String, trim: true, default: '' },
    program: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    notes: { type: String, trim: true, default: '' },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
},
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const BillingCustomer = mongoose.model('BillingCustomer', billingCustomerSchema);
module.exports = BillingCustomer;
