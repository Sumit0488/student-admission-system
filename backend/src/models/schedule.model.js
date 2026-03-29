const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  scheduleName:    { type: String, required: true, trim: true },
  stream:          { type: String, default: '' },  // kept for backward compat; derived from degree+branch
  degree:          { type: String, default: '' },
  branch:          { type: String, default: '' },
  academicYear:    { type: String, required: true },
  regPrefix:       { type: String, required: true, trim: true },
  applicantPrefix: { type: String, required: true, trim: true },
  maxSeats:        { type: Number, default: 60, min: 1 },
  filledSeats:     { type: Number, default: 0, min: 0 },
  applicantCount:  { type: Number, default: 0, min: 0 },
  programs:        [{ type: String, trim: true }],
  admissionType: {
    regular: {
      enabled:      { type: Boolean, default: false },
      allowedTerms: { type: [Number], default: [] },
    },
    lateral: {
      enabled:      { type: Boolean, default: false },
      allowedTerms: { type: [Number], default: [] },
    },
  },
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
