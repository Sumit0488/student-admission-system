const mongoose = require('mongoose');

const hostelEventSchema = new mongoose.Schema({
  event_id:    { type: String, unique: true },
  title:       { type: String, required: true },
  description: { type: String },
  event_type:  { type: String, enum: ['Cultural', 'Sports', 'Meeting', 'Maintenance', 'Inspection', 'Social', 'Other'], default: 'Other' },
  hostel_name: { type: String },
  venue:       { type: String },
  event_date:  { type: Date, required: true },
  end_date:    { type: Date },
  organizer:   { type: String },
  contact:     { type: String },
  participants_count: { type: Number, default: 0 },
  status:      { type: String, enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'], default: 'Upcoming' },
  notes:       { type: String },
  created_by:  { type: String, default: 'Admin' },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
}, { timestamps: true });

hostelEventSchema.pre('save', async function () {
  if (!this.event_id) {
    const count = await mongoose.model('HostelEvent').countDocuments();
    this.event_id = `EVT-${String(count + 1).padStart(4, '0')}`;
  }
});

module.exports = mongoose.model('HostelEvent', hostelEventSchema);
