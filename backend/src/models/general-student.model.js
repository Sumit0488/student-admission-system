const mongoose = require('mongoose');

const generateStudentId = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GEN-${ts}-${rand}`;
};

const generalStudentSchema = new mongoose.Schema(
  {
    institution_id: { type: String, trim: true },
    student_id: { type: String, unique: true, default: generateStudentId },
    name: { type: String, required: true, trim: true },
    mobile_number: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    stream: { type: String, trim: true, default: '' },
    program: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    batch: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    created_by: {
      user_email: { type: String, trim: true },
      user_name: { type: String, trim: true },
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const GeneralStudent = mongoose.model('GeneralStudent', generalStudentSchema);
module.exports = GeneralStudent;
