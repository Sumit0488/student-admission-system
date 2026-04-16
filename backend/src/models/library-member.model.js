const mongoose = require('mongoose');

const generateMemberId = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LIB-${ts}-${rand}`;
};

const libraryMemberSchema = new mongoose.Schema(
  {
    institution_id: { type: String, trim: true },
    member_id: { type: String, unique: true, default: generateMemberId },
    // Linked admission student
    student_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    usn: { type: String, trim: true, default: '' },
    name: { type: String, required: true, trim: true },
    mobile_number: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    program: { type: String, trim: true, default: '' },
    batch: { type: String, trim: true, default: '' },
    department: { type: String, trim: true, default: '' },
    // Library-specific fields
    membership_type: { type: String, enum: ['Student', 'Faculty', 'Staff', 'Guest'], default: 'Student' },
    membership_start: { type: Date },
    membership_end: { type: Date },
    books_issued: { type: Number, default: 0 },
    fine_due: { type: Number, default: 0 },
    fine_paid: { type: Number, default: 0 },
    barcode: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['Active', 'Suspended', 'Expired', 'Inactive'], default: 'Active' },
    notes: { type: String, trim: true, default: '' },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
},
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const LibraryMember = mongoose.model('LibraryMember', libraryMemberSchema);
module.exports = LibraryMember;
