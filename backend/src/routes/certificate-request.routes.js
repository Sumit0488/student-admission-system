'use strict';

const express = require('express');
const router = express.Router();
const CertificateRequest = require('../models/certificate-request.model');
const Certificate = require('../models/certificate.model');
const CertificateTemplate = require('../models/certificate-template.model');
const Student = require('../models/student.model');
const { checkEligibility } = require('../services/eligibility.service');
const { getTenantFilter } = require('../utils/tenantFilter');

// ── Variable substitution (shared pattern with certificate.routes.js) ──────────
const PROGRAM_NAMES = {
  CSE: 'Computer Science and Engineering',
  ECE: 'Electronics and Communication Engineering',
  MECH: 'Mechanical Engineering',
  CIVIL: 'Civil Engineering',
  MBA: 'Master of Business Administration',
  MCA: 'Master of Computer Applications',
  EEE: 'Electrical and Electronics Engineering',
  ISE: 'Information Science and Engineering',
  AIML: 'Artificial Intelligence and Machine Learning',
  AIDS: 'Artificial Intelligence and Data Science',
};
const ORDINALS = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

function buildVars(student, fallbackName, fallbackUsn) {
  const today = new Date();
  const currentDate = today.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  if (!student)
    return {
      student_name: fallbackName,
      usn: fallbackUsn,
      current_date: currentDate,
      place: 'Davanagere',
    };

  const sem = student.term ?? 1;
  const semOrd = ORDINALS[sem] ? `${ORDINALS[sem]} Semester` : `${sem}th Semester`;
  return {
    student_name: student.fullName || fallbackName,
    usn: student.student_id || fallbackUsn,
    father_name: student.fatherName || '',
    program: student.program || '',
    program_full_name:
      PROGRAM_NAMES[(student.program || '').toUpperCase()] || student.program || '',
    degree: student.degree || '',
    branch: student.program || '',
    batch: student.batch || '',
    academic_year: student.batch || '',
    semester: String(sem),
    current_term: semOrd,
    email: student.email || '',
    phone: student.phone || '',
    address: student.address || '',
    place: student.address ? student.address.split(',').pop().trim() : 'Davanagere',
    current_date: currentDate,
    status: student.admissionStatus || '',
  };
}

function substituteVars(template, vars) {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`\\{\\{${escaped}\\}\\}`, 'g'), String(v ?? ''));
  }
  return out;
}

// POST /api/certificate-requests  — student submits a new request
router.post('/', async (req, res) => {
  try {
    const { studentName, usn, certificateType, templateId, reason, deliveryType, additionalNotes } =
      req.body;
    if (!studentName?.trim())
      return res.status(400).json({ success: false, error: 'Student name is required' });
    if (!usn?.trim()) return res.status(400).json({ success: false, error: 'USN is required' });
    if (!certificateType)
      return res.status(400).json({ success: false, error: 'Certificate type is required' });
    if (!reason?.trim())
      return res.status(400).json({ success: false, error: 'Reason is required' });

    // ── Eligibility check ────────────────────────────────────────────────────
    const student = await Student.findOne({
      $or: [{ student_id: usn.trim().toUpperCase() }, { email: usn.trim() }],
      isDeleted: { $ne: true },
    });
    if (student) {
      const result = checkEligibility(student, certificateType);
      if (!result.eligible) {
        return res.status(400).json({
          success: false,
          eligible: false,
          error: result.failedChecks[0] || 'Student is not eligible for this certificate',
          failedChecks: result.failedChecks,
        });
      }
    }

    const doc = await CertificateRequest.create({
      studentName: studentName.trim(),
      usn: usn.trim().toUpperCase(),
      certificateType,
      templateId: templateId || null,
      reason: reason.trim(),
      deliveryType: deliveryType || 'Download',
      additionalNotes: additionalNotes?.trim() || '',
      ...(req.tenantId && { tenantId: req.tenantId }),
    });

    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/certificate-requests  — admin: list all requests
router.get('/', async (req, res) => {
  try {
    const { status, q = '' } = req.query;
    const filter = { ...getTenantFilter(req.tenantId) };
    if (status && status !== 'All') filter.status = status;
    if (q.trim()) {
      filter.$or = [
        { studentName: { $regex: q.trim(), $options: 'i' } },
        { usn: { $regex: q.trim(), $options: 'i' } },
        { certificateType: { $regex: q.trim(), $options: 'i' } },
      ];
    }
    const data = await CertificateRequest.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/certificate-requests/student/:usn  — student: own requests
router.get('/student/:usn', async (req, res) => {
  try {
    const data = await CertificateRequest.find({ usn: req.params.usn.trim().toUpperCase() }).sort({
      createdAt: -1,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/certificate-requests/:id  — admin: approve or reject
router.put('/:id', async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status value' });
    }

    const certReq = await CertificateRequest.findById(req.params.id);
    if (!certReq) return res.status(404).json({ success: false, error: 'Request not found' });

    const update = { status, remarks: remarks?.trim() || '' };

    if (status === 'Approved') {
      update.approvedDate = new Date();
      if (!certReq.certificateRef) {
        let tmpl = null;
        let templateId = certReq.templateId || null;

        if (templateId) {
          tmpl = await CertificateTemplate.findById(templateId);
        }
        if (!tmpl && certReq.certificateType) {
          tmpl = await CertificateTemplate.findOne({ name: certReq.certificateType });
          if (tmpl) templateId = tmpl._id;
        }

        let studentDoc = null;
        if (certReq.usn) {
          studentDoc = await Student.findOne({
            $or: [{ student_id: certReq.usn.toUpperCase() }, { email: certReq.usn }],
            isDeleted: { $ne: true },
          });
        }

        const resolvedName = certReq.studentName || studentDoc?.fullName || 'Unknown';
        const resolvedUsn = certReq.usn || studentDoc?.student_id || 'UNKNOWN';

        let filledNotes = '';
        if (tmpl) {
          const vars = buildVars(studentDoc, resolvedName, resolvedUsn);
          filledNotes = substituteVars(tmpl.notes || '', vars);
        }

        const cert = await Certificate.create({
          studentName: resolvedName,
          usn: resolvedUsn,
          type: certReq.certificateType,
          templateId,
          filledNotes,
          status: 'Approved',
          ...(req.tenantId && { tenantId: req.tenantId }),
        });
        update.certificateRef = cert._id;
      }
    }

    const doc = await CertificateRequest.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
