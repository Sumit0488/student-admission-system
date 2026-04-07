const express = require('express');
const router = express.Router();
const Schedule = require('../models/schedule.model');
const { getTenantFilter } = require('../utils/tenantFilter');

// ── Strict admission-type → term mapping ──────────────────────────────────────
// Regular = Term 1, Year 1 | Lateral = Term 3, Year 2
const ADMISSION_TYPE_MAP = {
  Regular: { term: 1, year_of_study: 1 },
  Lateral: { term: 3, year_of_study: 2 },
};

// Static pipeline stages (backend-driven as required)
const PIPELINE_STAGES = [
  { name: 'Inquiry', value: '1' },
  { name: 'Application', value: '2' },
  { name: 'Admitted', value: '3' },
  { name: 'Rejected', value: '4' },
  { name: 'Cancelled', value: '5' },
];

// ── Extract degree from schedule name ────────────────────────────────────────
// "BE Admission 2026"   → "BE"
// "BCA Admission 2025"  → "BCA"
// "B.Tech CSE 2025"     → "B.Tech"
// "MBA 2025"            → "MBA"
// Rules: the first whitespace-delimited token that matches a known degree label,
// OR simply the first word if nothing matches (so it always returns something).
const KNOWN_DEGREES = [
  'B.E',
  'BE',
  'B.Tech',
  'BTech',
  'M.E',
  'ME',
  'M.Tech',
  'MTech',
  'MBA',
  'MCA',
  'BCA',
  'BBA',
  'B.Sc',
  'BSc',
  'M.Sc',
  'MSc',
  'B.Com',
  'BCom',
  'M.Com',
  'MCom',
  'PhD',
  'Ph.D',
];

function extractDegreeFromName(scheduleName) {
  if (!scheduleName) return '';
  const firstWord = scheduleName.trim().split(/\s+/)[0];
  // Check if first word exactly matches a known degree (case-insensitive)
  const match = KNOWN_DEGREES.find((d) => d.toLowerCase() === firstWord.toLowerCase());
  // Return the canonical form if matched, otherwise return the first word as-is
  return match || firstWord;
}

// Build admission_details from a schedule document.
// Always includes both Regular and Lateral so the frontend dropdown is never empty.
// The schedule's admissionType.enabled flags determine which are "configured"
// (with known terms), but both types are always valid for admission.
function buildAdmissionDetails(schedule) {
  const details = [];
  // Regular — always included; use schedule's enabled config for term data
  const regEnabled = schedule.admissionType?.regular?.enabled;
  details.push({
    admission_type: 'Regular',
    configured: !!regEnabled,
    terms: [ADMISSION_TYPE_MAP.Regular],
  });
  // Lateral — always included
  const latEnabled = schedule.admissionType?.lateral?.enabled;
  details.push({
    admission_type: 'Lateral',
    configured: !!latEnabled,
    terms: [ADMISSION_TYPE_MAP.Lateral],
  });
  return details;
}

// GET /api/schedules
router.get('/', async (req, res) => {
  try {
    const filter = getTenantFilter(req.tenantId);
    const data = await Schedule.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/schedules/stages  — pipeline stage definitions (MUST be before /:id)
router.get('/stages', (_req, res) => {
  res.json({ success: true, data: PIPELINE_STAGES });
});

// POST /api/schedules/create
router.post('/create', async (req, res) => {
  try {
    const { scheduleName, academicYear, regPrefix, applicantPrefix, maxSeats } = req.body;
    if (!scheduleName?.trim())
      return res.status(400).json({ success: false, error: 'Schedule name is required' });
    if (!academicYear?.trim())
      return res.status(400).json({ success: false, error: 'Academic year is required' });
    if (!regPrefix?.trim())
      return res.status(400).json({ success: false, error: 'Reg No prefix is required' });
    if (!applicantPrefix?.trim())
      return res.status(400).json({ success: false, error: 'Applicant ID prefix is required' });
    if (maxSeats !== undefined && (isNaN(maxSeats) || Number(maxSeats) < 1)) {
      return res.status(400).json({ success: false, error: 'Max seats must be a positive number' });
    }

    const schedule = await Schedule.create({
      ...req.body,
      degree: extractDegreeFromName(req.body.scheduleName),
      ...(req.tenantId && { tenantId: req.tenantId }),
    });
    const scheduleObj = schedule.toObject();
    scheduleObj.admission_details = buildAdmissionDetails(schedule);
    res.status(201).json({ success: true, data: scheduleObj });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/schedules/:id  — single schedule with admission_details
router.get('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });
    const scheduleObj = schedule.toObject();
    scheduleObj.admission_details = buildAdmissionDetails(schedule);
    res.json({ success: true, data: scheduleObj });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/schedules/:id
router.put('/:id', async (req, res) => {
  try {
    // Degree is always derived from scheduleName — never set manually
    const update = {
      ...req.body,
      stream: req.body.scheduleName || req.body.stream || '',
      degree: extractDegreeFromName(req.body.scheduleName),
      branch: '',
    };
    const schedule = await Schedule.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });
    const scheduleObj = schedule.toObject();
    scheduleObj.admission_details = buildAdmissionDetails(schedule);
    res.json({ success: true, data: scheduleObj });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/schedules/:id
router.delete('/:id', async (req, res) => {
  try {
    await Schedule.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
