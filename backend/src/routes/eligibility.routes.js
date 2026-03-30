/**
 * Certificate Eligibility API
 *
 * POST /api/eligibility/check
 *   Body: { studentId, certificateType }
 *   Returns eligibility result without generating a certificate.
 *   Role: admin
 *
 * POST /api/eligibility/generate
 *   Body: { studentId, certificateType }
 *   Checks eligibility → if eligible, logs history + returns result.
 *   Actual PDF generation is still handled by /api/certificates.
 *   Role: admin
 *
 * GET /api/eligibility/history
 *   Query: ?studentId=&page=1&limit=20
 *   Returns paginated eligibility history.
 *   Role: admin
 *
 * GET /api/eligibility/history/:studentId
 *   Returns all history for one student.
 *   Role: admin
 */

const express  = require('express');
const mongoose = require('mongoose');
const Student  = require('../models/student.model');
const EligibilityHistory = require('../models/eligibility-history.model');
const { checkEligibility, CERTIFICATE_RULES } = require('../services/eligibility.service');

const router = express.Router();

// ─── Simple role-based middleware (admin-only) ────────────────────────────────
// Replace with your real auth middleware when available.
// This reads an `x-role` header; in production use JWT / session.
const adminOnly = (req, res, next) => {
  const role = (req.headers['x-role'] || '').toLowerCase();
  if (role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required.' });
  }
  next();
};

// ─── Helper: resolve student from DB ─────────────────────────────────────────
const resolveStudent = async (studentId) => {
  if (!studentId) return null;
  if (!mongoose.Types.ObjectId.isValid(studentId)) return null;
  return Student.findOne({ _id: studentId, isDeleted: { $ne: true } });
};

// ─── POST /check ─────────────────────────────────────────────────────────────
router.post('/check', adminOnly, async (req, res, next) => {
  try {
    const { studentId, certificateType } = req.body;

    if (!studentId || !certificateType) {
      return res.status(400).json({ success: false, error: 'studentId and certificateType are required.' });
    }

    const student = await resolveStudent(studentId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found.' });
    }

    const result = checkEligibility(student, certificateType);

    return res.json({
      success: true,
      student: { id: student._id, name: student.fullName, usn: student.student_id },
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /generate ───────────────────────────────────────────────────────────
router.post('/generate', adminOnly, async (req, res, next) => {
  try {
    const { studentId, certificateType } = req.body;
    const requestedBy = req.headers['x-user'] || 'admin';

    if (!studentId || !certificateType) {
      return res.status(400).json({ success: false, error: 'studentId and certificateType are required.' });
    }

    const student = await resolveStudent(studentId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found.' });
    }

    const result = checkEligibility(student, certificateType);

    // Always log the check attempt
    const history = await EligibilityHistory.create({
      studentId:            student._id,
      studentName:          student.fullName,
      usn:                  student.student_id,
      certificateType:      result.certificateType,
      eligible:             result.eligible,
      failedChecks:         result.failedChecks,
      requestedBy,
      certificateGenerated: result.eligible,
    });

    if (!result.eligible) {
      return res.status(422).json({
        success: false,
        eligible: false,
        certificateType: result.certificateType,
        failedChecks: result.failedChecks,
        historyId: history._id,
        message: 'Student is not eligible for this certificate.',
      });
    }

    return res.status(201).json({
      success: true,
      eligible: true,
      certificateType: result.certificateType,
      student: { id: student._id, name: student.fullName, usn: student.student_id },
      historyId: history._id,
      message: 'Student is eligible. Proceed to generate the certificate via /api/certificates.',
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /types ───────────────────────────────────────────────────────────────
// Returns list of supported certificate types and their rule descriptions.
router.get('/types', adminOnly, (_req, res) => {
  const types = Object.entries(CERTIFICATE_RULES).map(([type, rules]) => ({
    type,
    rules: rules.map((r) => r.label),
  }));
  res.json({ success: true, types });
});

// ─── GET /history ─────────────────────────────────────────────────────────────
router.get('/history', adminOnly, async (req, res, next) => {
  try {
    const { studentId, certificateType, eligible, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) filter.studentId = studentId;
    if (certificateType) filter.certificateType = { $regex: certificateType, $options: 'i' };
    if (eligible !== undefined) filter.eligible = eligible === 'true';

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await EligibilityHistory.countDocuments(filter);
    const records = await EligibilityHistory
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), limit: Number(limit), records });
  } catch (err) {
    next(err);
  }
});

// ─── GET /history/:studentId ──────────────────────────────────────────────────
router.get('/history/:studentId', adminOnly, async (req, res, next) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, error: 'Invalid studentId.' });
    }

    const records = await EligibilityHistory
      .find({ studentId })
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: records.length, records });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
