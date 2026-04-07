const express = require('express');
const router = express.Router();
const Approval = require('../models/approval.model');
const CertificateRequest = require('../models/certificate-request.model');
const Certificate = require('../models/certificate.model');
const CertificateTemplate = require('../models/certificate-template.model');
const Student = require('../models/student.model');
const { getTenantFilter } = require('../utils/tenantFilter');

// ── Variable substitution helpers (mirrors certificate.routes.js logic) ───────
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
  CSEDS: 'Computer Science and Engineering Data Science',
  CSEML: 'Computer Science and Engineering Machine Learning',
};
const PROGRAM_CODE_MAP = Object.fromEntries(
  Object.entries(PROGRAM_NAMES).map(([code, name]) => [name.toLowerCase(), code])
);
const getProgramCode = (p) => {
  if (!p) return '';
  if (PROGRAM_NAMES[p.toUpperCase()]) return p.toUpperCase();
  return PROGRAM_CODE_MAP[p.toLowerCase()] || p;
};
const getProgramFull = (p) => {
  if (!p) return '';
  if (PROGRAM_NAMES[p.toUpperCase()]) return PROGRAM_NAMES[p.toUpperCase()];
  return p;
};

const ORDINALS = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
const YEAR_ORDINALS = ['', '1st', '2nd', '3rd', '4th'];

function buildVars(student, fallbackName, fallbackUsn) {
  const today = new Date();
  const currentDate = today.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const currentYear = today.getFullYear();
  const fallbackAY = `${currentYear}-${String(currentYear + 1).slice(-2)}`;

  if (!student) {
    return {
      student_name: fallbackName,
      name: fallbackName,
      usn: fallbackUsn,
      roll_no: fallbackUsn,
      roll_number: fallbackUsn,
      academic_year: fallbackAY,
      accademic_year: fallbackAY,
      batch: fallbackAY,
      current_date: currentDate,
      date: currentDate,
      place: 'Davanagere',
    };
  }

  const batchYear = parseInt((student.batch || '').split('-')[0], 10);
  const semBase = (student.admissionCategory || '').toLowerCase() === 'lateral' ? 3 : 1;
  const sem = isNaN(batchYear)
    ? (student.term ?? 1)
    : Math.min(Math.max((currentYear - batchYear) * 2 + semBase, semBase), 8);
  const semOrd = ORDINALS[sem] ? `${ORDINALS[sem]} Semester` : `${sem}th Semester`;
  const yearNum = Math.ceil(sem / 2);
  const yearOrd = YEAR_ORDINALS[yearNum] || `${yearNum}th`;
  const yearLabel = `${yearOrd} Year`;
  const studentName = student.fullName || fallbackName;
  const usnVal = student.student_id || fallbackUsn;
  const programName = student.program || '';
  const programCode = getProgramCode(programName);
  const programFull = getProgramFull(programName);
  const academicYear = student.batch || fallbackAY;

  return {
    student_name: studentName,
    name: studentName,
    usn: usnVal,
    roll_no: usnVal,
    roll_number: usnVal,
    father_name: student.fatherName || '',
    program: programCode, // short code: "CSE", "ECE" …
    program_full_name: programFull, // full name
    branch: programFull, // alias → full name
    department: programFull, // alias → full name
    program_code: programCode, // explicit alias
    degree: student.degree || '',
    batch: student.batch || academicYear,
    academic_year: academicYear,
    accademic_year: academicYear, // common typo alias
    semester: String(sem),
    sem: String(sem),
    current_term: semOrd,
    year: yearLabel, // "2nd Year"
    year_number: String(yearNum), // "2"
    year_of_study: yearLabel,
    email: student.email || '',
    phone: student.phone || '',
    address: student.address || '',
    place: student.address ? student.address.split(',').pop().trim() : 'Davanagere',
    current_date: currentDate,
    date: currentDate,
    status: student.admissionStatus || '',
  };
}

function substituteVars(template, vars) {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`\\{\\{${escaped}\\}\\}`, 'g'), String(v ?? ''));
  }
  // Strip any remaining unresolved placeholders and log them
  const remaining = [...out.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)].map((m) => m[1]);
  if (remaining.length > 0) {
    console.warn('[Approval] Unresolved placeholders — stripped:', [...new Set(remaining)]);
    out = out.replace(/\{\{[a-zA-Z0-9_]+\}\}/g, '');
  }
  return out;
}

// GET /api/approvals?status=&q=
router.get('/', async (req, res) => {
  try {
    const { status, q = '' } = req.query;
    const filter = { ...getTenantFilter(req.tenantId) };
    if (status && status !== 'All') filter.status = status;
    if (q.trim()) {
      filter.$or = [
        { studentName: { $regex: q.trim(), $options: 'i' } },
        { usn: { $regex: q.trim(), $options: 'i' } },
        { certificate: { $regex: q.trim(), $options: 'i' } },
      ];
    }
    const data = await Approval.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/approvals/:id  (update status + sync linked CertificateRequest)
router.put('/:id', async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status value' });
    }

    const approval = await Approval.findById(req.params.id);
    if (!approval) return res.status(404).json({ success: false, error: 'Approval not found' });

    const approvalUpdate = { status };
    if (remarks?.trim()) approvalUpdate.remarks = remarks.trim();

    // ── Try to find a linked CertificateRequest ──────────────────────────────
    let certReq = null;
    if (approval.certificateRef) {
      certReq = await CertificateRequest.findById(approval.certificateRef);
    }

    if (certReq) {
      // This approval came from a student certificate request
      const certReqUpdate = { status, remarks: remarks?.trim() || '' };

      if (status === 'Approved') {
        certReqUpdate.approvedDate = new Date();

        if (!certReq.certificateRef) {
          // ── Build filled notes from template + student data ────────────────
          let filledNotes = '';
          let templateId = null;

          // Look up the matching LIVE template by name
          const tmpl = await CertificateTemplate.findOne({ name: certReq.certificateType });
          if (tmpl) {
            templateId = tmpl._id;

            // Fetch student for variable substitution
            const studentDoc = await Student.findOne({
              $or: [{ student_id: certReq.usn }, { email: certReq.usn }],
              isDeleted: { $ne: true },
            });

            const vars = buildVars(studentDoc, certReq.studentName, certReq.usn);
            filledNotes = substituteVars(tmpl.notes || '', vars);
          }

          const cert = await Certificate.create({
            studentName: certReq.studentName,
            usn: certReq.usn,
            type: certReq.certificateType,
            templateId,
            filledNotes,
            status: 'Approved',
          });

          certReqUpdate.certificateRef = cert._id;
          approvalUpdate.certificateRef = cert._id;
        } else {
          // Certificate was already created — just update its status
          await Certificate.findByIdAndUpdate(certReq.certificateRef, { status });
        }
      } else {
        // Rejected or Pending — sync status to the linked Certificate if it exists
        if (certReq.certificateRef) {
          await Certificate.findByIdAndUpdate(certReq.certificateRef, { status });
        }
      }

      await CertificateRequest.findByIdAndUpdate(certReq._id, certReqUpdate);
    } else if (approval.certificateRef) {
      // No CertificateRequest found — certificateRef points directly to a Certificate
      // (admin issued the certificate directly from the student profile)
      await Certificate.findByIdAndUpdate(approval.certificateRef, {
        status,
        ...(status === 'Approved' ? { generatedDate: null } : {}),
      });
    }

    const updated = await Approval.findByIdAndUpdate(req.params.id, approvalUpdate, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
