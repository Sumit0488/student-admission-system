const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema({
  studentName:   { type: String, required: true, trim: true },
  usn:           { type: String, required: true, trim: true },
  certificate:   { type: String, required: true },
  requestedDate: { type: Date, default: Date.now },
  status:        { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  // optional back-link to the Certificate document
  certificateRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Certificate', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Approval', approvalSchema);
