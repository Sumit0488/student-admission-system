const express = require('express');
const router = express.Router();

const CertificateRequest = require('../models/certificate-request.model');
const Certificate = require('../models/certificate.model');
const CertificateTemplate = require('../models/certificate-template.model');
const Student = require('../models/student.model');
const Tenant = require('../models/tenant.model');
const { checkEligibility } = require('../services/eligibility.service');
const { getTenantFilter } = require('../utils/tenantFilter');

// Fix #1 — import shared utils instead of duplicating buildVars / substituteVars
const { buildAutoVars, substituteVars } = require('../utils/certificateVars');

// Fix #7 — valid forward-only status transitions (Pending → Approved or Rejected)
const VALID_TRANSITIONS = {
  Pending: ['Approved', 'Rejected'],
  Approved: [],
  Rejected: [],
};

// ── Helper: resolve template for a certificate request ────────────────────────
async function resolveTemplate(certReq) {
  if (certReq.templateId) {
    const tmpl = await CertificateTemplate.findById(certReq.templateId);
    if (tmpl) return tmpl;
  }
  if (certReq.certificateType) {
    // exact name match first, then partial
    const tmpl =
      (await CertificateTemplate.findOne({ name: certReq.certificateType })) ||
      (await CertificateTemplate.findOne({
        name: { $regex: certReq.certificateType, $options: 'i' },
      }));
    return tmpl || null;
  }
  return null;
}

// ── Helper: build filled notes for a new certificate ─────────────────────────
// Fix #8 — parallel DB calls where independent (student + tenant fetched together)
async function buildFilledNotes(certReq, tenantId) {
  const [tmpl, studentDoc, tenant] = await Promise.all([
    resolveTemplate(certReq),
    certReq.usn
      ? Student.findOne({
          $or: [{ student_id: certReq.usn.toUpperCase() }, { email: certReq.usn }],
          isDeleted: { $ne: true },
        })
      : Promise.resolve(null),
    tenantId
      ? Tenant.findById(tenantId).select('collegeAddress name').lean()
      : Promise.resolve(null),
  ]);

  if (!tmpl) return { tmpl: null, filledNotes: '' };

  const tenantInfo = {
    place: tenant?.collegeAddress?.city || '',
    name: tenant?.name || '',
  };
  const vars = buildAutoVars(studentDoc, certReq.studentName, certReq.usn, tenantInfo);
  const filledNotes = substituteVars(tmpl.notes || '', vars);
  return { tmpl, filledNotes };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  POST /api/certificate-requests  — student submits a new request
// ═══════════════════════════════════════════════════════════════════════════════
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

    // Fix #4 — unknown USN blocks the request rather than silently passing
    const student = await Student.findOne({
      $or: [{ student_id: usn.trim().toUpperCase() }, { email: usn.trim() }],
      isDeleted: { $ne: true },
    });
    if (!student) {
      return res.status(400).json({
        success: false,
        error: 'Student not found. Please check your USN or email address.',
      });
    }

    const eligibility = checkEligibility(student, certificateType);
    if (!eligibility.eligible) {
      return res.status(400).json({
        success: false,
        error: eligibility.failedChecks[0] || 'Student is not eligible for this certificate',
        failedChecks: eligibility.failedChecks,
      });
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
    console.error('[CertificateRequest] POST error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  GET /api/certificate-requests  — admin: list all requests
// ═══════════════════════════════════════════════════════════════════════════════
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
    console.error('[CertificateRequest] GET / error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  GET /api/certificate-requests/student/:usn  — student: own requests
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/student/:usn', async (req, res) => {
  try {
    // Fix #3 — tenant isolation applied so students can't read other tenants' data
    const filter = {
      usn: req.params.usn.trim().toUpperCase(),
      ...getTenantFilter(req.tenantId),
    };
    const data = await CertificateRequest.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) {
    console.error('[CertificateRequest] GET /student/:usn error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  PATCH /api/certificate-requests/:id  — admin: approve or reject
//  Fix #6 — PATCH (partial update) instead of PUT (full replacement)
// ═══════════════════════════════════════════════════════════════════════════════
router.patch('/:id', async (req, res) => {
  try {
    const { status, remarks } = req.body;

    const certReq = await CertificateRequest.findById(req.params.id);
    if (!certReq) return res.status(404).json({ success: false, error: 'Request not found' });

    // Fix #7 — enforce valid forward-only transitions (Pending → Approved/Rejected only)
    const allowed = VALID_TRANSITIONS[certReq.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot transition from "${certReq.status}" to "${status}". Allowed: ${allowed.join(', ') || 'none'}`,
      });
    }

    const update = { status, remarks: remarks?.trim() || '' };

    // Fix #5 — approval logic extracted to helpers (buildFilledNotes, resolveTemplate)
    if (status === 'Approved' && !certReq.certificateRef) {
      update.approvedDate = new Date();

      const { tmpl, filledNotes } = await buildFilledNotes(certReq, req.tenantId);

      // Fix #9 — warn caller when no template was found (certificate still created)
      if (!tmpl) {
        console.warn(
          '[CertificateRequest] No template found for type "%s" — certificate created with empty notes',
          certReq.certificateType
        );
      }

      const cert = await Certificate.create({
        studentName: certReq.studentName,
        usn: certReq.usn,
        type: certReq.certificateType,
        templateId: tmpl?._id || null,
        filledNotes,
        status: 'Approved',
        ...(req.tenantId && { tenantId: req.tenantId }),
      });
      update.certificateRef = cert._id;

      // Surface the missing-template warning to the API caller
      if (!tmpl) {
        const doc = await CertificateRequest.findByIdAndUpdate(req.params.id, update, {
          new: true,
        });
        return res.status(207).json({
          success: true,
          data: doc,
          warning: `Certificate approved but no template found for type "${certReq.certificateType}". The PDF will be empty until a matching template is created.`,
        });
      }
    }

    const doc = await CertificateRequest.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, data: doc });
  } catch (err) {
    console.error('[CertificateRequest] PATCH /:id error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Keep backward-compatible PUT alias so existing frontend calls don't break
// Fix #6 — the PUT route now delegates to PATCH logic
router.put('/:id', (req, res, next) => {
  req.method = 'PATCH';
  router.handle(req, res, next);
});

module.exports = router;
