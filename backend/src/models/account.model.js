const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    account_id: { type: String, unique: true, trim: true },
    institution_id: { type: String, trim: true, default: 'INST001' },
    account_name: { type: String, required: true, trim: true },
    account_type: { type: String, enum: ['Purchase', 'Sell'], required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

accountSchema.pre('save', async function () {
  if (!this.account_id) {
    const count = await mongoose.model('Account').countDocuments();
    this.account_id = `${this.institution_id}-ACC-${String(count + 1).padStart(4, '0')}`;
  }
});

const Account = mongoose.model('Account', accountSchema);
module.exports = Account;
