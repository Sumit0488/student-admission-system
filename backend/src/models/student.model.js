const mongoose = require('mongoose');

const generateStudentId = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `STU-${ts}-${rand}`;
};

const studentSchema = new mongoose.Schema(
  {
    student_id: {
      type: String,
      unique: true,
      default: generateStudentId,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    personalEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => v === '' || /^\+91\d{10}$/.test(v),
        message: 'Phone must be in format +91XXXXXXXXXX (10 digits after +91)',
      },
    },
    program: {
      type: String,
      trim: true,
    },
    degree: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      trim: true,
    },
    admissionStatus: {
      type: String,
      enum: ['Live', 'Completed', 'Cancelled', 'Detained'],
      default: 'Live',
    },
    batch: {
      type: String,
      trim: true,
    },
    term: {
      type: Number,
      default: null,
    },
    admissionCategory: {
      type: String,
      enum: ['Regular', 'Lateral', ''],
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isDebarred: {
      type: Boolean,
      default: false,
    },
    feesCleared: {
      type: Boolean,
      default: true, // assume cleared unless explicitly marked otherwise
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    // Personal details — copied from enquiry on admission
    gender: { type: String, trim: true, default: '' },
    dob: { type: Date, default: null },
    religion: { type: String, trim: true, default: '' },
    caste: { type: String, trim: true, default: '' },
    fatherName: { type: String, trim: true, default: '' },
    admissionDate: { type: Date, default: null },
    lastJoiningDate: { type: Date, default: null },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Full-text index for search
studentSchema.index(
  { fullName: 'text', email: 'text', program: 'text', remarks: 'text' },
  { name: 'student_text_index' }
);

// Unique phone — only enforced when phone is a non-empty string
// (sparse + partialFilter so students without phones don't clash)
studentSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: { phone: { $exists: true, $ne: '' }, isDeleted: false },
    name: 'unique_phone',
  }
);

// Compound indexes for common filters
studentSchema.index({ admissionStatus: 1, isDeleted: 1 });
studentSchema.index({ program: 1, isDeleted: 1 });
studentSchema.index({ batch: 1, isDeleted: 1 });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
