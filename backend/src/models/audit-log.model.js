'use strict';
const mongoose = require('mongoose');

/**
 * AuditLog — tracks every meaningful action performed on a student record.
 * Kept append-only: never deleted, never updated.
 *
 * actionType values:
 *   CREATED              – student record first created
 *   UPDATED              – profile fields edited
 *   STATUS_CHANGED       – admissionStatus changed
 *   CERTIFICATE_ISSUED   – admin issued a certificate for this student
 *   CERTIFICATE_APPROVED – certificate PDF approved / generated
 *   CERTIFICATE_REJECTED – certificate rejected
 */
const auditLogSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      enum: [
        'CREATED',
        'UPDATED',
        'STATUS_CHANGED',
        'CERTIFICATE_ISSUED',
        'CERTIFICATE_APPROVED',
        'CERTIFICATE_REJECTED',
      ],
      required: true,
    },
    // Who performed the action — email or name from JWT / x-user header
    performedBy: {
      type: String,
      default: 'admin',
    },
    // Arbitrary extra context (old/new status, certificate type, etc.)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

// Composite index for "all logs for this student, newest first"
auditLogSchema.index({ studentId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
