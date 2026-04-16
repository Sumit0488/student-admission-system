const mongoose = require('mongoose');

const generateHostelId = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HST-${ts}-${rand}`;
};

const hostelStudentSchema = new mongoose.Schema(
  {
    institution_id: { type: String, trim: true },
    hostel_id: { type: String, unique: true, default: generateHostelId },
    // Linked admission student
    student_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    usn: { type: String, trim: true, default: '' },
    name: { type: String, required: true, trim: true },
    mobile_number: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    program: { type: String, trim: true, default: '' },
    batch: { type: String, trim: true, default: '' },
    gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
    // Hostel-specific fields
    hostel_name: { type: String, trim: true, default: '' },
    room_number: { type: String, trim: true, default: '' },
    room_type: { type: String, enum: ['Single', 'Double', 'Triple', 'Dormitory', ''], default: '' },
    block: { type: String, trim: true, default: '' },
    floor: { type: String, trim: true, default: '' },
    admission_date: { type: Date },
    vacating_date: { type: Date },
    fee_due: { type: Number, default: 0 },
    fee_paid: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Vacated', 'Pending'], default: 'Active' },
    guardian_name: { type: String, trim: true, default: '' },
    guardian_mobile: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
},
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const HostelStudent = mongoose.model('HostelStudent', hostelStudentSchema);
module.exports = HostelStudent;
