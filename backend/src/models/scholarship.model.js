const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema(
  {
    institution_id: { type: String, trim: true },
    academic_year: { type: String, trim: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    applied_date: { type: Date },
    issued_date: { type: Date },
    sanctioned_date: { type: Date },
    scholarship_schedule_id: { type: String, trim: true },
    application_no: { type: String, trim: true },
    scholarship_amount: { type: Number, default: 0 },
    ref_no: { type: String, trim: true, default: '' },
    scholarship_paid_to_student: { type: Number, default: 0 },
    scholarship_paid_to_college: { type: Number, default: 0 },
    scholarship_status: { type: String, trim: true, default: 'Applied' },
    term: { type: Number },
    year: { type: String, trim: true },
    branch: { type: String, trim: true },
    category: { type: String, trim: true },
    scholarship_type: { type: String, trim: true },
    student_name: { type: String, trim: true },
    created_by: {
      user_email: { type: String, trim: true },
      user_name: { type: String, trim: true },
    },
    updated_by: {
      user_email: { type: String, trim: true },
      user_name: { type: String, trim: true },
    },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
},
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const Scholarship = mongoose.model('Scholarship', scholarshipSchema);
module.exports = Scholarship;
