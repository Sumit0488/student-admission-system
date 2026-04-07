const mongoose = require('mongoose');

/**
 * Tracks every eligibility check + certificate generation attempt.
 * Useful for audit trails and admin dashboards.
 */
const eligibilityHistorySchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true, default: null },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    studentName: { type: String, required: true },
    usn: { type: String, required: true },
    certificateType: { type: String, required: true },

    // Result of the eligibility check
    eligible: { type: Boolean, required: true },
    failedChecks: { type: [String], default: [] }, // human-readable reasons

    // Who triggered this (admin role)
    requestedBy: { type: String, default: 'admin' },

    // Was a certificate actually generated after passing eligibility?
    certificateGenerated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EligibilityHistory', eligibilityHistorySchema);
