const mongoose = require('mongoose');

const generateRecordId = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `REC-${ts}-${rand}`;
};

const payRecordSchema = new mongoose.Schema(
  {
    institution_id: { type: String, trim: true },
    name: { type: String, trim: true },
    bank_name: { type: String, trim: true, default: '' },
    ref_no: { type: String, trim: true, default: '' },
    transaction_date: { type: Date },
    transaction_amount: { type: Number, default: 0 },
    status: { type: String, default: 'captured' },
    description: { type: String, trim: true, default: '' },
    method: { type: String, trim: true, default: '' },
    record_id: { type: String, unique: true, default: generateRecordId },
    module_name: { type: String, trim: true, default: 'Fee' },
    app_type: { type: String, trim: true, default: 'Admin' },
    transaction_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeTransaction' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const PayRecord = mongoose.model('PayRecord', payRecordSchema);
module.exports = PayRecord;
