const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema(
  {
    institution_id: { type: String, trim: true },
    stream: { type: String, required: true, trim: true },
    fee_category: { type: String, required: true, trim: true },
    batch: { type: String, required: true, trim: true },
    quota: { type: String, required: true, trim: true },
    program: { type: String, required: true, trim: true },
    fee_struct_name: { type: String, required: true, trim: true },
    fee_structure: [
      {
        fee_head: { type: String, trim: true },
        fee_priority: { type: Number },
        fee_head_amount: { type: Number, default: 0 },
      },
    ],
    fee_total_amount: { type: Number, required: true, default: 0 },
    admission_type: { type: String, trim: true, default: '' },
    module_name: { type: String, trim: true, default: 'Fee' },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
},
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
module.exports = FeeStructure;
