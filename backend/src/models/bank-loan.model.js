const mongoose = require('mongoose');

const bankLoanSchema = new mongoose.Schema(
  {
    institution_id: { type: String, trim: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    student_name: { type: String, trim: true },
    bank_name: { type: String, trim: true },
    account_number: { type: String, trim: true },
    reference_number: { type: String, trim: true },
    loan_date: { type: Date },
    amount: { type: Number, default: 0 },
    loan_type: { type: String, trim: true, default: 'Student Loan' },
    status: { type: String, default: 'active' },
    notes: { type: String, trim: true, default: '' },
    created_by: {
      user_email: { type: String, trim: true },
      user_name: { type: String, trim: true },
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const BankLoan = mongoose.model('BankLoan', bankLoanSchema);
module.exports = BankLoan;
