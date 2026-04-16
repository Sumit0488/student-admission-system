const mongoose = require('mongoose');

const generateAlumniId = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ALM-${ts}-${rand}`;
};

const alumniSchema = new mongoose.Schema(
  {
    institution_id: { type: String, trim: true },
    alumni_id: { type: String, unique: true, default: generateAlumniId },
    // Linked admission student
    student_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    usn: { type: String, trim: true, default: '' },
    name: { type: String, required: true, trim: true },
    mobile_number: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    personal_email: { type: String, trim: true, default: '' },
    program: { type: String, trim: true, default: '' },
    batch: { type: String, trim: true, default: '' },
    graduation_year: { type: String, trim: true, default: '' },
    cgpa: { type: String, trim: true, default: '' },
    // Current info
    current_company: { type: String, trim: true, default: '' },
    current_designation: { type: String, trim: true, default: '' },
    current_location: { type: String, trim: true, default: '' },
    linkedin_url: { type: String, trim: true, default: '' },
    industry: { type: String, trim: true, default: '' },
    // Higher education
    higher_education: { type: String, trim: true, default: '' },
    higher_education_institute: { type: String, trim: true, default: '' },
    // Status
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    gender: { type: String, trim: true, default: '' },
    dob: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
},
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const Alumni = mongoose.model('Alumni', alumniSchema);
module.exports = Alumni;
