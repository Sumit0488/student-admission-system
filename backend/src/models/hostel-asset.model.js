const mongoose = require('mongoose');

const hostelAssetSchema = new mongoose.Schema({
  issue_id:      { type: String, unique: true },
  hostel_student_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'HostelStudent' },
  student_name:  { type: String, required: true },
  usn:           { type: String },
  room_number:   { type: String },
  hostel_name:   { type: String },
  item_name:     { type: String, required: true },
  item_category: { type: String, enum: ['Furniture', 'Electronics', 'Linen', 'Kitchen', 'Sports', 'Other'], default: 'Other' },
  quantity:      { type: Number, default: 1 },
  issue_date:    { type: Date, default: Date.now },
  expected_return_date: { type: Date },
  actual_return_date:   { type: Date },
  condition_at_issue:   { type: String, enum: ['Good', 'Fair', 'Poor'], default: 'Good' },
  condition_at_return:  { type: String, enum: ['Good', 'Fair', 'Damaged', 'Lost'] },
  status:        { type: String, enum: ['Issued', 'Returned', 'Overdue', 'Lost'], default: 'Issued' },
  remarks:       { type: String },
  issued_by:     { type: String, default: 'Admin' },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
}, { timestamps: true });

hostelAssetSchema.pre('save', async function (next) {
  if (!this.issue_id) {
    const count = await mongoose.model('HostelAsset').countDocuments();
    this.issue_id = `AST-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('HostelAsset', hostelAssetSchema);
