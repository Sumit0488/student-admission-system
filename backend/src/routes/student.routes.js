const express = require('express');
const router = express.Router();
const {
  createStudent,
  getStudents,
  getStatusCounts,
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

// NOTE: static paths (/search, /counts, /export) must be BEFORE /:id
router.get('/search', searchStudents); // GET  /api/students/search?name=
router.get('/counts', getStatusCounts); // GET  /api/students/counts
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
