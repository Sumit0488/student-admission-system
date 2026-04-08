const Student = require('../models/student.model');
const generateUSN = require('../utils/generateUSN');
const { notFound, duplicate, validationErr } = require('../utils/errorHandler');
const { validateCreateInput, validateUpdateInput, validateStatus } = require('../utils/validators');
const { getTenantFilter } = require('../utils/tenantFilter');

// ─── Capitalize each word: "vinay k b" → "Vinay K B" ────────────────────────
const toTitleCase = (str) => str.replace(/\b\w/g, (c) => c.toUpperCase());

// ─── Dynamic term calculation ─────────────────────────────────────────────────
// batch format: "2022-23", "2025-26"
// Indian academic year runs Aug–Jul (two semesters each):
//   Semester 1 (odd):  Aug – Jan
//   Semester 2 (even): Feb – Jul
// Regular: starts at semester 1 | Lateral: starts at semester 3
const calculateTerm = (batch, admissionCategory) => {
  if (!batch) return null;
  const batchYear = parseInt((batch || '').split('-')[0], 10);
  if (isNaN(batchYear)) return null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // The academic year that is currently active.
  // Aug–Dec of a year → that year is the start of the academic year.
  // Jan–Jul of a year → the previous year is the start of the academic year.
  const academicStartYear = currentMonth >= 8 ? currentYear : currentYear - 1;

  // How many complete academic years have elapsed since enrollment
  const yearsElapsed = academicStartYear - batchYear;
  if (yearsElapsed < 0) return null; // batch is in the future — no term yet

  // Within the current academic year:
  //   Aug–Jan (month >= 8 or month == 1): first semester of that year → offset 0
  //   Feb–Jul (month 2-7):               second semester of that year → offset 1
  const semesterOffset = currentMonth >= 2 && currentMonth <= 7 ? 1 : 0;

  const base = (admissionCategory || '').toLowerCase() === 'lateral' ? 3 : 1;
  const term = yearsElapsed * 2 + semesterOffset + base;
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
  quota: s.quota || '',
  status: s.admissionStatus,
  isDebarred: s.isDebarred ?? false,
  feesCleared: s.feesCleared ?? true,
  attendanceCleared: s.attendanceCleared ?? true,
  examPassed: s.examPassed ?? true,
  noDues: s.noDues ?? true,
  createdAt: s.createdAt,
});

// ─── Tenant filter helper — includes legacy records (no tenantId) ────────────
const tenantFilter = (tenantId) => getTenantFilter(tenantId);

// ─── CREATE ───────────────────────────────────────────────────────────────────
const createStudent = async (body, tenantId = null) => {
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

  const existing = await Student.findOne({ email, isDeleted: { $ne: true } })
    .select('_id')
    .lean();
  if (existing) throw duplicate('email');

  if (phone) {
    const phoneExists = await Student.findOne({ phone, isDeleted: { $ne: true } })
      .select('_id')
      .lean();
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
    ...(tenantId && { tenantId }),
  });

  return format(student);
};

// ─── READ ALL (with filters + pagination) ────────────────────────────────────
const getStudents = async (query = {}, tenantId = null) => {
  const { q = '', program = '', batch = '', status = '', page = 1, limit = 20 } = query;

  const filter = { ...tenantFilter(tenantId), isDeleted: { $ne: true } };

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
  // Run count + fetch in parallel; .lean() skips Mongoose document hydration for ~30% speed gain.
  const [total, students] = await Promise.all([
    Student.countDocuments(filter),
    Student.find(filter)
      .select(
        'student_id fullName email phone program batch admissionStatus admissionCategory term tenantId isDeleted createdAt'
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
  ]);

  return { students: students.map(format), total, page: Number(page), limit: Number(limit) };
};

// ─── STATUS COUNTS (aggregation) ─────────────────────────────────────────────
const getStatusCounts = async (tenantId = null) => {
  const rows = await Student.aggregate([
    { $match: { ...tenantFilter(tenantId), isDeleted: { $ne: true } } },
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
  const degree = body.degree !== undefined ? body.degree?.trim() || null : undefined;
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

  // Run duplicate checks in parallel when both phone and email are being updated
  const checks = [];
  if (phone)
    checks.push(
      Student.findOne({ phone, isDeleted: { $ne: true }, _id: { $ne: id } })
        .select('_id')
        .lean()
    );
  if (email)
    checks.push(
      Student.findOne({ email, isDeleted: { $ne: true }, _id: { $ne: id } })
        .select('_id')
        .lean()
    );
  if (checks.length === 2) {
    const [phoneExists, emailExists] = await Promise.all(checks);
    if (phoneExists) throw duplicate('phone number');
    if (emailExists) throw duplicate('email');
  } else if (phone) {
    const phoneExists = await Student.findOne({ phone, isDeleted: { $ne: true }, _id: { $ne: id } })
      .select('_id')
      .lean();
    if (phoneExists) throw duplicate('phone number');
  } else if (email) {
    const emailExists = await Student.findOne({ email, isDeleted: { $ne: true }, _id: { $ne: id } })
      .select('_id')
      .lean();
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
      ...(body.quota !== undefined && { quota: body.quota.trim() }),
      ...(body.isDebarred !== undefined && { isDebarred: Boolean(body.isDebarred) }),
      ...(body.feesCleared !== undefined && { feesCleared: Boolean(body.feesCleared) }),
      ...(body.attendanceCleared !== undefined && {
        attendanceCleared: Boolean(body.attendanceCleared),
      }),
      ...(body.examPassed !== undefined && { examPassed: Boolean(body.examPassed) }),
      ...(body.noDues !== undefined && { noDues: Boolean(body.noDues) }),
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
const searchStudents = async (query = '', tenantId = null) => {
  const students = await Student.find({
    ...tenantFilter(tenantId),
    isDeleted: { $ne: true },
    fullName: { $regex: query.trim(), $options: 'i' },
  })
    .select(
      'student_id fullName email phone program batch admissionStatus admissionCategory term createdAt'
    )
    .sort({ createdAt: -1 })
    .lean();
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
const exportStudents = async (query = {}, tenantId = null) => {
  const { program = '' } = query;

  const filter = { ...tenantFilter(tenantId), isDeleted: { $ne: true }, admissionStatus: 'Live' };
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

const exportFullReport = async (tenantId = null) => {
  const students = await Student.find({ ...tenantFilter(tenantId), isDeleted: { $ne: true } })
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
