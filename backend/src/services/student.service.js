const Student = require('../models/student.model');
const generateUSN = require('../utils/generateUSN');
const { notFound, duplicate, validationErr } = require('../utils/errorHandler');
const { validateCreateInput, validateUpdateInput, validateStatus } = require('../utils/validators');

// ─── Capitalize each word: "vinay k b" → "Vinay K B" ────────────────────────
const toTitleCase = (str) => str.replace(/\b\w/g, (c) => c.toUpperCase());

// ─── Dynamic term calculation ─────────────────────────────────────────────────
// batch format: "2022-23", "2025-26"
// Regular: (currentYear - batchYear) * 2 + 1   →  starts at semester 1
// Lateral:  (currentYear - batchYear) * 2 + 3   →  starts at semester 3
const calculateTerm = (batch, admissionCategory) => {
  if (!batch) return null;
  const batchYear = parseInt((batch || '').split('-')[0], 10);
  if (isNaN(batchYear)) return null;
  const currentYear = new Date().getFullYear();
  const base = (admissionCategory || '').toLowerCase() === 'lateral' ? 3 : 1;
  const term = (currentYear - batchYear) * 2 + base;
  return Math.min(Math.max(term, base), 8);
};

// ─── Response formatter (shapes DB document → API response) ──────────────────
const format = (s) => ({
  id: String(s._id),
  student_id: s.student_id || '',
  name: s.fullName,
  email: s.email || '',
  personalEmail: s.personalEmail || '',
  phone: s.phone || '',
  address: s.address || '',
  city: s.city || '',
  program: s.program || '',
  degree: s.degree || '',
  batch: s.batch || '',
  department: s.department || s.program || '',
  semester: calculateTerm(s.batch, s.admissionCategory) ?? s.term ?? null,
  admissionCategory: s.admissionCategory || '',
  status: s.admissionStatus,
  isDebarred: s.isDebarred ?? false,
  feesCleared: s.feesCleared ?? true,
  createdAt: s.createdAt,
});

// ─── CREATE ───────────────────────────────────────────────────────────────────
const createStudent = async (body) => {
  validateCreateInput(body);

  const name = toTitleCase((body.name || '').trim());
  const program = (body.program || '').trim();
  const batch = (body.batch || '').trim();
  const status = (body.status || '').trim();
  const phone = (body.phone || '').trim();
  const personalEmail = (body.personalEmail || '').trim().toLowerCase();
  const address = (body.address || '').trim();
  const city = (body.city || '').trim();
  const term = body.term !== null && body.term !== undefined ? Number(body.term) : null;
  const admissionCategory = (body.admissionCategory || '').trim();

  const slug = name.toLowerCase().replace(/\s+/g, '.');
  const email = (body.email?.trim() || `${slug}.${Date.now()}@student.edu`).toLowerCase();

  const existing = await Student.findOne({ email, isDeleted: { $ne: true } });
  if (existing) throw duplicate('email');

  if (phone) {
    const phoneExists = await Student.findOne({ phone, isDeleted: { $ne: true } });
    if (phoneExists) throw duplicate('phone number');
  }

  const student_id = await generateUSN(program, batch);

  const student = await Student.create({
    student_id,
    fullName: name,
    email,
    personalEmail,
    phone,
    address,
    city,
    program,
    batch,
    term,
    admissionCategory,
    admissionStatus: status || 'Live',
  });

  return format(student);
};

// ─── READ ALL (with filters + pagination) ────────────────────────────────────
const getStudents = async (query = {}) => {
  const { q = '', program = '', batch = '', status = '', page = 1, limit = 20 } = query;

  const filter = { isDeleted: { $ne: true } };

  if (q.trim()) {
    filter.$or = [
      { fullName: { $regex: q.trim(), $options: 'i' } },
      { student_id: { $regex: q.trim(), $options: 'i' } },
      { program: { $regex: q.trim(), $options: 'i' } },
    ];
  }
  if (program)
    filter.program = {
      $regex: new RegExp(`^${program.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    };
  if (batch) filter.batch = batch;
  if (status) filter.admissionStatus = status;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Student.countDocuments(filter);
  const students = await Student.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return { students: students.map(format), total, page: Number(page), limit: Number(limit) };
};

// ─── STATUS COUNTS (aggregation) ─────────────────────────────────────────────
const getStatusCounts = async () => {
  const rows = await Student.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: '$admissionStatus', count: { $sum: 1 } } },
  ]);
  const counts = { Live: 0, Completed: 0, Cancelled: 0, Detained: 0 };
  rows.forEach(({ _id, count }) => {
    if (_id in counts) counts[_id] = count;
  });
  return counts;
};

// ─── READ ONE ─────────────────────────────────────────────────────────────────
const getStudentById = async (id) => {
  const student = await Student.findById(id);
  if (!student || student.isDeleted === true) throw notFound('Student');
  return format(student);
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
const updateStudent = async (id, body) => {
  validateUpdateInput(body);

  const name = body.name !== undefined ? toTitleCase(body.name.trim()) : undefined;
  if (name !== undefined && !name) throw validationErr('Full name cannot be empty');
  const program = body.program !== undefined ? body.program.trim() : undefined;
  const degree = body.degree !== undefined ? body.degree.trim() || null : undefined;
  const batch = body.batch !== undefined ? body.batch.trim() : undefined;
  const status = body.status !== undefined ? body.status.trim() : undefined;
  const phone = body.phone !== undefined ? body.phone.trim() : undefined;
  const email = body.email !== undefined ? body.email.trim().toLowerCase() : undefined;
  const personalEmail =
    body.personalEmail !== undefined ? body.personalEmail.trim().toLowerCase() : undefined;
  const address = body.address !== undefined ? body.address.trim() : undefined;
  const city = body.city !== undefined ? body.city.trim() : undefined;
  const term =
    body.term !== undefined ? (body.term !== null ? Number(body.term) : null) : undefined;
  const admissionCategory =
    body.admissionCategory !== undefined ? (body.admissionCategory || '').trim() : undefined;

  if (phone) {
    const phoneExists = await Student.findOne({
      phone,
      isDeleted: { $ne: true },
      _id: { $ne: id },
    });
    if (phoneExists) throw duplicate('phone number');
  }

  if (email) {
    const emailExists = await Student.findOne({
      email,
      isDeleted: { $ne: true },
      _id: { $ne: id },
    });
    if (emailExists) throw duplicate('email');
  }

  const student = await Student.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    {
      ...(name !== undefined && { fullName: name }),
      ...(program !== undefined && { program }),
      ...(degree !== undefined && { degree }),
      ...(batch !== undefined && { batch }),
      ...(status !== undefined && { admissionStatus: status }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(personalEmail !== undefined && { personalEmail }),
      ...(term !== undefined && { term }),
      ...(admissionCategory !== undefined && { admissionCategory }),
      ...(body.isDebarred !== undefined && { isDebarred: Boolean(body.isDebarred) }),
      ...(body.feesCleared !== undefined && { feesCleared: Boolean(body.feesCleared) }),
    },
    { new: true, runValidators: true }
  );

  if (!student) throw notFound('Student');
  return format(student);
};

// ─── SOFT DELETE ──────────────────────────────────────────────────────────────
const deleteStudent = async (id) => {
  const student = await Student.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    { isDeleted: true },
    { new: true }
  );
  if (!student) throw notFound('Student');
  return student.fullName;
};

// ─── DISTINCT PROGRAMS ───────────────────────────────────────────────────────
const getDistinctPrograms = async () => {
  const programs = await Student.distinct('program', {
    isDeleted: { $ne: true },
    program: { $ne: '' },
  });
  return programs.filter(Boolean).sort();
};

// ─── SEARCH ───────────────────────────────────────────────────────────────────
const searchStudents = async (query = '') => {
  const students = await Student.find({
    isDeleted: { $ne: true },
    fullName: { $regex: query.trim(), $options: 'i' },
  }).sort({ createdAt: -1 });
  return students.map(format);
};

// ─── CHANGE STATUS ────────────────────────────────────────────────────────────
const updateStudentStatus = async (id, status) => {
  validateStatus(status);

  const student = await Student.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    { admissionStatus: status },
    { new: true }
  );
  if (!student) throw notFound('Student');
  return format(student);
};

// ─── EXPORT (Live students only, no pagination) ───────────────────────────────
const exportStudents = async (query = {}) => {
  const { program = '' } = query;

  const filter = { isDeleted: { $ne: true }, admissionStatus: 'Live' };
  if (program) filter.program = program;

  const students = await Student.find(filter)
    .sort({ program: 1, student_id: 1 })
    .select('student_id fullName email program');

  return students.map((s) => ({
    usn: s.student_id || '',
    name: s.fullName || '',
    email: s.email || '',
    program: s.program || '',
  }));
};

// ─── FULL REPORT (all statuses, all students, no pagination) ─────────────────
const REPORT_STATUSES = ['Live', 'Completed', 'Cancelled', 'Detained'];

const exportFullReport = async () => {
  const students = await Student.find({ isDeleted: { $ne: true } })
    .sort({ admissionStatus: 1, program: 1, student_id: 1 })
    .select('student_id fullName email program batch admissionStatus');

  const groups = {};
  REPORT_STATUSES.forEach((s) => {
    groups[s] = [];
  });

  students.forEach((s) => {
    const status = s.admissionStatus || 'Live';
    if (groups[status]) {
      groups[status].push({
        usn: s.student_id || '',
        name: s.fullName || '',
        email: s.email || '',
        program: s.program || '',
        batch: s.batch || '',
        semester: s.term !== null && s.term !== undefined ? String(s.term) : '',
        status,
      });
    }
  });

  return { groups, total: students.length };
};

module.exports = {
  createStudent,
  getStudents,
  getStatusCounts,
  getStudentById,
  updateStudent,
  deleteStudent,
  searchStudents,
  updateStudentStatus,
  exportStudents,
  exportFullReport,
  getDistinctPrograms,
};
