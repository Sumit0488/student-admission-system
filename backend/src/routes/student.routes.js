const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const {
  createStudent,
  getStudents,
  getStatusCounts,
  getDashboard,
  getStudentById,
  exportStudents,
  exportFullReport,
  getDistinctPrograms,
  updateStudent,
  deleteStudent,
  searchStudents,
  changeStatus,
} = require('../controllers/student');
const Student = require('../models/student.model');
const AuditLog = require('../models/audit-log.model');
const Enquiry = require('../models/enquiry.model');
const Schedule = require('../models/schedule.model');

// ─── Recalculate term helper (same formula as student.service.js) ─────────────
function calcTerm(batch, category) {
  const batchYear = parseInt((batch || '').split('-')[0], 10);
  if (isNaN(batchYear)) return null;
  const currentYear = new Date().getFullYear();
  const base = (category || '').toLowerCase() === 'lateral' ? 3 : 1;
  return Math.min(Math.max((currentYear - batchYear) * 2 + base, base), 8);
}

// ─── POST /api/students/migrate/recalculate-terms ────────────────────────────
// One-time migration: infer admissionCategory from stored term (if blank),
// then write the dynamically-calculated term back to the DB for every student.
router.post('/migrate/recalculate-terms', async (req, res) => {
  try {
    const students = await Student.find({ isDeleted: { $ne: true } }).select(
      '_id batch term admissionCategory'
    );

    const ops = students.map((s) => {
      // Infer category for students that have no admissionCategory set yet
      const category = s.admissionCategory || (s.term === 3 ? 'Lateral' : 'Regular');
      const newTerm = calcTerm(s.batch, category);
      return {
        updateOne: {
          filter: { _id: s._id },
          update: { $set: { admissionCategory: category, term: newTerm } },
        },
      };
    });

    const result = await Student.bulkWrite(ops);
    res.json({ success: true, updated: result.modifiedCount, total: students.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/students/migrate/backfill-degree ───────────────────────────────
// One-time migration: for every student with no degree, find their original
// enquiry → schedule and set degree from schedule name's first word.
router.post('/migrate/backfill-degree', async (req, res) => {
  try {
    // Find students missing degree
    const students = await Student.find({
      isDeleted: { $ne: true },
      $or: [{ degree: '' }, { degree: null }, { degree: { $exists: false } }],
    }).select('_id student_id email');

    if (students.length === 0) {
      return res.json({
        success: true,
        updated: 0,
        total: 0,
        message: 'All students already have a degree.',
      });
    }

    // For each student, find the linked enquiry → schedule
    const ops = [];
    for (const s of students) {
      const enquiry = await Enquiry.findOne({
        $or: [{ convertedStudentId: s.student_id }, { email: s.email }],
        scheduleId: { $ne: null },
      })
        .select('scheduleId')
        .lean();

      if (!enquiry?.scheduleId) continue;

      const schedule = await Schedule.findById(enquiry.scheduleId)
        .select('degree scheduleName')
        .lean();
      if (!schedule) continue;

      const degree = schedule.degree || (schedule.scheduleName || '').trim().split(/\s+/)[0] || '';
      if (!degree) continue;

      ops.push({
        updateOne: { filter: { _id: s._id }, update: { $set: { degree } } },
      });
    }

    const result = ops.length ? await Student.bulkWrite(ops) : { modifiedCount: 0 };
    res.json({ success: true, updated: result.modifiedCount, total: students.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/students/bulk-update ──────────────────────────────────────────
// Body: { studentIds: string[], action: "status", value: "Live" | ... }
router.post('/bulk-update', async (req, res) => {
  try {
    const { studentIds, action, value } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0)
      return res
        .status(400)
        .json({ success: false, error: 'studentIds must be a non-empty array' });
    if (action !== 'status')
      return res.status(400).json({ success: false, error: 'action must be "status"' });
    const VALID = ['Live', 'Completed', 'Cancelled', 'Detained'];
    if (!VALID.includes(value))
      return res
        .status(400)
        .json({ success: false, error: `value must be one of: ${VALID.join(', ')}` });

    const validIds = studentIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0)
      return res.status(400).json({ success: false, error: 'No valid student IDs provided' });

    const result = await Student.updateMany(
      { _id: { $in: validIds }, isDeleted: { $ne: true } },
      { $set: { admissionStatus: value } }
    );

    // Log audit entries for every updated student
    const performedBy = req.user?.email || req.headers['x-user'] || 'admin';
    const auditDocs = validIds.map((sid) => ({
      studentId: sid,
      actionType: 'STATUS_CHANGED',
      performedBy,
      metadata: { newStatus: value, bulk: true },
      ...(req.tenantId && { tenantId: req.tenantId }),
    }));
    await AuditLog.insertMany(auditDocs);

    res.json({ success: true, updated: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/students/bulk-export ──────────────────────────────────────────
// Body: { studentIds: string[] }
// Returns CSV text with headers: USN,Name,Email,Program,Batch,Status,Quota
router.post('/bulk-export', async (req, res) => {
  try {
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0)
      return res
        .status(400)
        .json({ success: false, error: 'studentIds must be a non-empty array' });

    const validIds = studentIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const students = await Student.find({ _id: { $in: validIds }, isDeleted: { $ne: true } })
      .select('student_id fullName email program batch admissionStatus quota')
      .lean();

    if (students.length === 0)
      return res.status(404).json({ success: false, error: 'No students found for provided IDs' });

    // Build CSV
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['USN', 'Full Name', 'Email', 'Program', 'Batch', 'Status', 'Quota'];
    const rows = students.map((s) =>
      [
        escape(s.student_id),
        escape(s.fullName),
        escape(s.email),
        escape(s.program),
        escape(s.batch),
        escape(s.admissionStatus),
        escape(s.quota),
      ].join(',')
    );
    const csv = [header.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="selected_students.csv"');
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/students/:id/audit-logs ─────────────────────────────────────────
router.get('/:id/audit-logs', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: 'Invalid student ID' });

    const logs = await AuditLog.find({ studentId: id }).sort({ createdAt: -1 }).limit(100).lean();
    return res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// NOTE: static paths (/search, /counts, /export) must be BEFORE /:id
router.get('/search', searchStudents); // GET  /api/students/search?name=
router.get('/counts', getStatusCounts); // GET  /api/students/counts
router.get('/dashboard', getDashboard); // GET  /api/students/dashboard (counts + live list merged)
router.get('/programs', getDistinctPrograms); // GET  /api/students/programs
router.get('/export', exportStudents); // GET  /api/students/export?program=
router.get('/export/report', exportFullReport); // GET  /api/students/export/report
router.get('/', getStudents); // GET  /api/students?q=&program=&batch=&status=&page=&limit=
router.post('/', createStudent); // POST   /api/students
router.get('/:id', getStudentById); // GET    /api/students/:id
router.put('/:id/status', changeStatus); // PUT    /api/students/:id/status
router.put('/:id', updateStudent); // PUT    /api/students/:id
router.delete('/:id', deleteStudent); // DELETE /api/students/:id

module.exports = router;
