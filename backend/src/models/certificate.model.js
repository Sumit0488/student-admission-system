const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  studentName:   { type: String, required: true, trim: true },
  usn:           { type: String, required: true, trim: true },
  type:          { type: String, required: true },       // free-form — driven by template name
  templateId:    { type: mongoose.Schema.Types.ObjectId, ref: 'CertificateTemplate', default: null },
  filledNotes:   { type: String, default: '' },          // notes after {{key}} substitution
  fieldValues:   { type: Map, of: String, default: {} }, // actual values used for substitution
  requestedDate: { type: Date, default: Date.now },
  generatedDate: { type: Date, default: null },
  status:        { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Generated'], default: 'Pending' },
}, { timestamps: true });

module.exports = mongoose.model('Certificate', certificateSchema);
