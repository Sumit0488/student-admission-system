'use strict';

const express              = require('express');
const router               = express.Router();
const CertificateRequest   = require('../models/certificate-request.model');
const Certificate          = require('../models/certificate.model');
const CertificateTemplate  = require('../models/certificate-template.model');
const Approval             = require('../models/approval.model');
const Student              = require('../models/student.model');

// ── Variable substitution (shared pattern with certificate.routes.js) ──────────
const PROGRAM_NAMES = {
  CSE: 'Computer Science and Engineering', ECE: 'Electronics and Communication Engineering',
  MECH: 'Mechanical Engineering', CIVIL: 'Civil Engineering',
  MBA: 'Master of Business Administration', MCA: 'Master of Computer Applications',
  EEE: 'Electrical and Electronics Engineering', ISE: 'Information Science and Engineering',
  AIML: 'Artificial Intelligence and Machine Learning', AIDS: 'Artificial Intelligence and Data Science',
};
const ORDINALS = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

function buildVars(student, fallbackName, fallbackUsn) {
  const today       = new Date();
  const currentDate = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  if (!student) return { student_name: fallbackName, usn: fallbackUsn, current_date: currentDate, place: 'Davanagere' };

  const sem    = student.term ?? 1;
  const semOrd = ORDINALS[sem] ? `${ORDINALS[sem]} Semester` : `${sem}th Semester`;
  return {
    student_name:      student.fullName        || fallbackName,
    usn:               student.student_id      || fallbackUsn,
    father_name:       student.fatherName      || '',
    program:           student.program         || '',
    program_full_name: PROGRAM_NAMES[(student.program || '').toUpperCase()] || student.program || '',
    degree:            student.degree          || '',
    branch:            student.program         || '',
    batch:             student.batch           || '',
    academic_year:     student.batch           || '',
    semester:          String(sem),
    current_term:      semOrd,
    email:             student.email           || '',
    phone:             student.phone           || '',
    address:           student.address         || '',
    place:             student.address ? student.address.split(',').pop().trim() : 'Davanagere',
    current_date:      currentDate,
    status:            student.admissionStatus || '',
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
    const { studentName, usn, certificateType, templateId, reason, deliveryType, additionalNotes } = req.body;
    if (!studentName?.trim())  return res.status(400).json({ success: false, error: 'Student name is required' });
    if (!usn?.trim())          return res.status(400).json({ success: false, error: 'USN is required' });
    if (!certificateType)      return res.status(400).json({ success: false, error: 'Certificate type is required' });
    if (!reason?.trim())       return res.status(400).json({ success: false, error: 'Reason is required' });

    const doc = await CertificateRequest.create({
      studentName:     studentName.trim(),
      usn:             usn.trim().toUpperCase(),
      certificateType,
      templateId:      templateId || null,
      reason:          reason.trim(),
      deliveryType:    deliveryType || 'Download',
      additionalNotes: additionalNotes?.trim() || '',
    });

    // Auto-create a matching Approval record so it appears in the admin Approvals page
    await Approval.create({
      studentName:  doc.studentName,
      usn:          doc.usn,
      certificate:  doc.certificateType,
      requestedDate: doc.requestedDate,
      status:       'Pending',
      // store back-link so we can sync status later
      certificateRef: doc._id,
    });

    res.status(201).json({ success: true, data: doc });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/certificate-requests  — admin: list all requests
router.get('/', async (req, res) => {
  try {
    const { status, q = '' } = req.query;
    const filter = {};
    if (status && status !== 'All') filter.status = status;
    if (q.trim()) {
      filter.$or = [
        { studentName:     { $regex: q.trim(), $options: 'i' } },
        { usn:             { $regex: q.trim(), $options: 'i' } },
        { certificateType: { $regex: q.trim(), $options: 'i' } },
      ];
    }
    const data = await CertificateRequest.find(filter).sort({ requestedDate: -1 });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/certificate-requests/student/:usn  — student: own requests
router.get('/student/:usn', async (req, res) => {
  try {
    const data = await CertificateRequest
      .find({ usn: req.params.usn.trim().toUpperCase() })
      .sort({ requestedDate: -1 });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
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
        // ── Look up template by ID (preferred) or fall back to name ───────────
        let tmpl     = null;
        let templateId = certReq.templateId || null;

        if (templateId) {
          tmpl = await CertificateTemplate.findById(templateId);
        }
        if (!tmpl && certReq.certificateType) {
          tmpl = await CertificateTemplate.findOne({ name: certReq.certificateType });
          if (tmpl) templateId = tmpl._id;
        }

        let filledNotes = '';
        if (tmpl) {
          const studentDoc = await Student.findOne({
            $or: [{ student_id: certReq.usn }, { email: certReq.usn }],
            isDeleted: { $ne: true },
          });
          const vars = buildVars(studentDoc, certReq.studentName, certReq.usn);
          filledNotes = substituteVars(tmpl.notes || '', vars);
          console.log('[CertReq approve] template:', tmpl.name, '| templateId:', templateId);
        }

        const cert = await Certificate.create({
          studentName: certReq.studentName,
          usn:         certReq.usn,
          type:        certReq.certificateType,
          templateId,
          filledNotes,
          status:      'Approved',
        });
        update.certificateRef = cert._id;
      }
    }

    const doc = await CertificateRequest.findByIdAndUpdate(req.params.id, update, { new: true });

    // Sync status back to the linked Approval record
    await Approval.findOneAndUpdate(
      { certificateRef: certReq._id },
      { status, ...(status === 'Approved' ? { certificateRef: update.certificateRef || certReq.certificateRef } : {}) }
    );

    res.json({ success: true, data: doc });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
