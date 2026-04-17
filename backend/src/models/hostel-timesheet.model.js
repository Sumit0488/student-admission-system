const mongoose = require('mongoose');

const hostelTimesheetSchema = new mongoose.Schema({
  record_id:   { type: String, unique: true },
  hostel_student_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'HostelStudent' },
  student_name:{ type: String, required: true },
  usn:         { type: String },
  hostel_name: { type: String },
  room_number: { type: String },
  date:        { type: Date, required: true },
  check_in:    { type: String },  // "HH:MM" format
  check_out:   { type: String },  // "HH:MM" format
  status:      { type: String, enum: ['Present', 'Absent', 'Late', 'Leave', 'Half Day'], default: 'Present' },
  leave_type:  { type: String, enum: ['Home', 'Medical', 'Official', 'Other'] },
  remarks:     { type: String },
  recorded_by: { type: String, default: 'Admin' },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
}, { timestamps: true });

hostelTimesheetSchema.index({ date: -1, usn: 1 });

hostelTimesheetSchema.pre('save', async function () {
  if (!this.record_id) {
    const count = await mongoose.model('HostelTimesheet').countDocuments();
    this.record_id = `TS-${String(count + 1).padStart(5, '0')}`;
  }
});

module.exports = mongoose.model('HostelTimesheet', hostelTimesheetSchema);
