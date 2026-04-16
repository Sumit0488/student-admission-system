const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  module:      { type: String, required: true }, // Library, Hostel, Fee, Alumni, etc.
  action:      { type: String, required: true }, // member_added, fine_collected, member_deleted, etc.
  action_label:{ type: String },                 // Human-readable: "Member Added"
  entity_id:   { type: String },                 // ID of the record acted on
  entity_label:{ type: String },                 // Name/label of the record
  usn:         { type: String },
  student_name:{ type: String },
  amount:      { type: Number },
  details:     { type: String },                 // Additional details / note
  performed_by:{ type: String, default: 'Admin' },
  ip:          { type: String },
  meta:        { type: mongoose.Schema.Types.Mixed }, // extra flexible data
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
}, { timestamps: true });

activityLogSchema.index({ module: 1, createdAt: -1 });
activityLogSchema.index({ action: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
