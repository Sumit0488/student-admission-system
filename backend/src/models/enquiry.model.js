const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
  date:   { type: Date, required: true },
  note:   { type: String, trim: true, default: '' },
  status: { type: String, default: '' },
}, { _id: true, timestamps: true });

const documentSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  submitted: { type: Boolean, default: false },
}, { _id: false });

const enquirySchema = new mongoose.Schema({
  // ── Core identity ────────────────────────────────────────────────────────
  name:  { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, trim: true, lowercase: true },

  // ── Schedule link ─────────────────────────────────────────────────────────
  scheduleId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', default: null },
  stream:       { type: String, default: '' },
  academicYear: { type: String, default: '' },
  batch:        { type: String, default: '' },

  // ── Programme ────────────────────────────────────────────────────────────
  program: { type: String, default: '' },

  // ── Admission category & term ────────────────────────────────────────────
  admissionCategory: { type: String, enum: ['', 'Regular', 'Lateral'], default: '' },
  term:              { type: Number, default: null },

  // ── Admission details (all dynamic — no enums) ───────────────────────────
  admissionDate: { type: Date,   default: null },
  admissionMode: { type: String, default: '' },
  quota:         { type: String, default: '' },
  seatNumber:    { type: String, default: '' },
  seatCategory:  { type: String, default: '' },
  kannada:       { type: String, default: '' },

  // ── Enquiry status & pipeline stage ──────────────────────────────────────
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Follow-up', 'Interested', 'Converted', 'Rejected'],
    default: 'New',
  },
  admissionStage: {
    type: String,
    enum: ['Enquiry', 'Application', 'Verified', 'Admitted', 'Cancelled'],
    default: 'Enquiry',
  },
  interestLevel: { type: String, enum: ['', 'High', 'Medium', 'Low'], default: '' },

  // ── Generated identifiers ────────────────────────────────────────────────
  applicantId:        { type: String, default: null },
  regNo:              { type: String, default: null },
  convertedStudentId: { type: String, default: null },

  // ── Personal details ─────────────────────────────────────────────────────
  gender:       { type: String, default: '' },
  dob:          { type: Date,   default: null },
  aadhaar:      { type: String, default: '' },
  pan:          { type: String, default: '' },
  bloodGroup:   { type: String, default: '' },
  area:         { type: String, default: '' },
  motherTongue: { type: String, default: '' },
  religion:     { type: String, default: '' },
  caste:        { type: String, default: '' },
  subCaste:     { type: String, default: '' },

  // ── Entrance exam ────────────────────────────────────────────────────────
  examName:          { type: String,  default: '' },
  examRank:          { type: Number,  default: null },
  hallTicketNo:      { type: String,  default: '' },
  examYear:          { type: Number,  default: null },
  admOrderDate:      { type: Date,    default: null },
  issuedDate:        { type: Date,    default: null },
  allotmentDate:     { type: Date,    default: null },
  lastJoiningDate:   { type: Date,    default: null },
  claimedSeatCat:    { type: String,  default: '' },
  allotedSeatCat:    { type: String,  default: '' },
  admOrderNumber:    { type: String,  default: '' },
  feePaid:           { type: Number,  default: null },
  prevQualification: { type: String,  default: '' },

  // ── Previous education ───────────────────────────────────────────────────
  prevBoard:       { type: String, default: '' },
  prevCollege:     { type: String, default: '' },
  prevPercentage:  { type: Number, default: null },
  prevYearPassing: { type: Number, default: null },

  // ── Father details ───────────────────────────────────────────────────────
  fatherName:       { type: String, default: '' },
  fatherContact:    { type: String, default: '' },
  fatherOccupation: { type: String, default: '' },
  fatherIncome:     { type: Number, default: null },
  fatherEmail:      { type: String, default: '' },
  fatherPan:        { type: String, default: '' },

  // ── Mother details ───────────────────────────────────────────────────────
  motherName:       { type: String, default: '' },
  motherContact:    { type: String, default: '' },
  motherOccupation: { type: String, default: '' },
  motherIncome:     { type: Number, default: null },
  motherEmail:      { type: String, default: '' },
  motherPan:        { type: String, default: '' },

  // ── Address ──────────────────────────────────────────────────────────────
  addressLine: { type: String, default: '' },
  city:        { type: String, default: '' },
  state:       { type: String, default: '' },
  pincode:     { type: String, default: '' },

  // ── History & documents ──────────────────────────────────────────────────
  followUps: { type: [followUpSchema], default: [] },
  documents: { type: [documentSchema], default: [] },
  notes:     { type: String, default: '', trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Enquiry', enquirySchema);
