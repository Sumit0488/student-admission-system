const mongoose = require('mongoose');

const certRequestSchema = new mongoose.Schema({
  studentName:     { type: String, required: true, trim: true },
  usn:             { type: String, required: true, trim: true },
  certificateType: { type: String, required: true, trim: true },
  reason:          { type: String, required: true, trim: true },
  deliveryType:    { type: String, enum: ['Download', 'Hard Copy'], default: 'Download' },
  additionalNotes: { type: String, default: '', trim: true },
  status:          { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  requestedDate:   { type: Date, default: Date.now },
  approvedDate:    { type: Date, default: null },
  remarks:         { type: String, default: '', trim: true },
  // Template used for this request — enables ID-based lookup on approval
  templateId:      { type: mongoose.Schema.Types.ObjectId, ref: 'CertificateTemplate', default: null },
  // Created when admin approves — used for PDF download
  certificateRef:  { type: mongoose.Schema.Types.ObjectId, ref: 'Certificate', default: null },
}, { timestamps: true });

module.exports = mongoose.model('CertificateRequest', certRequestSchema);
