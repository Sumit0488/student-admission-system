const express = require('express');
const router = express.Router();
const multer = require('multer');
// const pdfParse             = require('pdf-parse');
// v143.0.0 and v143.0.4 have no GitHub release assets — v133.0.0 is the
// latest version confirmed available at the Sparticuz/chromium repository.
const CHROMIUM_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v133.0.0/chromium-v133.0.0-pack.tar';

// Lazy-load heavy PDF deps — prevents startup crash if not installed
async function getLaunchOptions() {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    const chromium = require('@sparticuz/chromium-min');
    return {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(CHROMIUM_URL),
      headless: chromium.headless,
    };
  }
  const localPuppeteer = require('puppeteer');
  return {
    executablePath: localPuppeteer.executablePath(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  };
}
const Certificate = require('../models/certificate.model');
const CertificateTemplate = require('../models/certificate-template.model');
const Approval = require('../models/approval.model');
const Student = require('../models/student.model');
const Tenant = require('../models/tenant.model');
const AuditLog = require('../models/audit-log.model');
const { getTenantFilter } = require('../utils/tenantFilter');
const CertificateApprovalService = require('../services/certificateApproval.service');

// multer — memory storage (no temp files), 10 MB limit, PDF only
const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are accepted'));
  },
});

// multer — image upload, 5 MB limit, images only
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are accepted (jpg, png, gif, webp, svg)'));
  },
});

// ── Program name lookups ──────────────────────────────────────────────────────
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

// Reverse: full name → code (built once at startup)
const PROGRAM_CODE_MAP = Object.fromEntries(
  Object.entries(PROGRAM_NAMES).map(([code, name]) => [name.toLowerCase(), code])
);

function getFullProgramName(program) {
  if (!program) return '';
  // Already a code?
  if (PROGRAM_NAMES[program.toUpperCase()]) return PROGRAM_NAMES[program.toUpperCase()];
  // Otherwise return as-is (may already be full name)
  return program;
}

function getProgramCode(program) {
  if (!program) return '';
  // Already a code?
  if (PROGRAM_NAMES[program.toUpperCase()]) return program.toUpperCase();
  // Try reverse lookup (full name → code)
  return PROGRAM_CODE_MAP[program.toLowerCase()] || program;
}

const ORDINALS = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

const YEAR_ORDINALS = ['', '1st', '2nd', '3rd', '4th'];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAY_ORDINALS = [
  '',
  'First',
  'Second',
  'Third',
  'Fourth',
  'Fifth',
  'Sixth',
  'Seventh',
  'Eighth',
  'Ninth',
  'Tenth',
  'Eleventh',
  'Twelfth',
  'Thirteenth',
  'Fourteenth',
  'Fifteenth',
  'Sixteenth',
  'Seventeenth',
  'Eighteenth',
  'Nineteenth',
  'Twentieth',
  'Twenty First',
  'Twenty Second',
  'Twenty Third',
  'Twenty Fourth',
  'Twenty Fifth',
  'Twenty Sixth',
  'Twenty Seventh',
  'Twenty Eighth',
  'Twenty Ninth',
  'Thirtieth',
  'Thirty First',
];

const NUM_ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];
const NUM_TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function numberToWords(n) {
  if (n === 0) return '';
  if (n < 20) return NUM_ONES[n];
  if (n < 100) return NUM_TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + NUM_ONES[n % 10] : '');
  if (n < 1000) {
    const rem = n % 100;
    return NUM_ONES[Math.floor(n / 100)] + ' Hundred' + (rem ? ' and ' + numberToWords(rem) : '');
  }
  if (n < 10000) {
    const rem = n % 1000;
    return NUM_ONES[Math.floor(n / 1000)] + ' Thousand' + (rem ? ' ' + numberToWords(rem) : '');
  }
  return String(n);
}

// "14 July 2003"
function formatDateInWords(dateString) {
  const date = new Date(dateString);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

// "Fourteenth July Two Thousand Three"
function formatDateFullWords(dateString) {
  const date = new Date(dateString);
  const day = DAY_ORDINALS[date.getDate()] || String(date.getDate());
  const month = MONTHS[date.getMonth()];
  const year = numberToWords(date.getFullYear());
  return `${day} ${month} ${year}`;
}

// Build a variable map from a Student document for template auto-fill
// tenantInfo = { place: string, name: string } from the Tenant document
function buildAutoVars(student, fallbackName, fallbackUsn, tenantInfo) {
  const ti = typeof tenantInfo === 'string' ? { place: tenantInfo } : tenantInfo || {};
  const DEFAULT_PLACE = ti.place || 'Davanagere';
  const COLLEGE_NAME = ti.name || '';
  const today = new Date();
  const currentDate = today.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (!student) {
    const y = new Date().getFullYear();
    const ay = `${y}-${String(y + 1).slice(-2)}`;
    return {
      student_name: fallbackName,
      name: fallbackName,
      usn: fallbackUsn,
      roll_no: fallbackUsn,
      roll_number: fallbackUsn,
      academic_year: ay,
      accademic_year: ay,
      batch: ay,
      current_date: currentDate,
      date: currentDate,
      place: DEFAULT_PLACE,
      college_name: COLLEGE_NAME,
    };
  }

  // Dynamic term — month-aware academic year calculation (mirrors student.service.js calculateTerm)
  // Indian academic year: Aug–Jul  |  Sem 1 = Aug–Jan, Sem 2 = Feb–Jul
  const calcSem = () => {
    const batchYear = parseInt((student.batch || '').split('-')[0], 10);
    if (isNaN(batchYear)) return student.term ?? 1;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    // Academic year that is currently active
    const academicStartYear = currentMonth >= 8 ? currentYear : currentYear - 1;
    const yearsElapsed = academicStartYear - batchYear;
    if (yearsElapsed < 0) return student.term ?? 1; // batch in future
    // Feb–Jul = second semester of the academic year (+1), otherwise first (+0)
    const semesterOffset = currentMonth >= 2 && currentMonth <= 7 ? 1 : 0;
    const base = (student.admissionCategory || '').toLowerCase() === 'lateral' ? 3 : 1;
    const term = yearsElapsed * 2 + semesterOffset + base;
    return Math.min(Math.max(term, base), 8);
  };
  const sem = calcSem();
  const semStr = String(sem);
  const semOrd = ORDINALS[sem] ? `${ORDINALS[sem]} Semester` : `${sem}th Semester`;
  const yearNum = Math.ceil(sem / 2); // 1–4
  const yearOrd = YEAR_ORDINALS[yearNum] || `${yearNum}th`;
  const yearLabel = `${yearOrd} Year`; // "1st Year", "2nd Year" …
  const studentName = student.fullName || fallbackName;
  const usnVal = student.student_id || fallbackUsn;
  const programName = student.program || '';
  const programCode = getProgramCode(programName); // "CSE", "ECE" …
  const programFull = getFullProgramName(programName); // "Computer Science and Engineering" …
  // academic_year: use batch if set, else build from current calendar year
  const academicYear =
    student.batch ||
    (() => {
      const y = new Date().getFullYear();
      return `${y}-${String(y + 1).slice(-2)}`;
    })();

  const vars = {
    // ── Student identity ───────────────────────────────────────────────────
    student_name: studentName,
    name: studentName,
    usn: usnVal,
    roll_no: usnVal,
    roll_number: usnVal,
    father_name: student.fatherName || '',
    email: student.email || '',
    phone: student.phone || '',
    address: student.address || '',
    place: student.city || DEFAULT_PLACE,

    // ── Academic ───────────────────────────────────────────────────────────
    program: programCode, // short code: "CSE", "ECE" …
    program_full_name: programFull, // "Computer Science and Engineering" …
    branch: programFull, // alias → full name
    department: programFull, // alias → full name
    program_code: programCode, // explicit code alias
    degree: student.degree || '',
    batch: student.batch || academicYear,
    // Wrapped in nowrap span so "2022-23" doesn't break at the hyphen in PDF
    academic_year: `<span style="white-space:nowrap">${academicYear}</span>`,
    accademic_year: `<span style="white-space:nowrap">${academicYear}</span>`,

    // ── Term / semester / year ─────────────────────────────────────────────
    semester: semStr, // "3"
    sem: semStr, // alias
    current_term: semOrd, // "3rd Semester"
    year: yearLabel, // "2nd Year"  ← formatted
    year_number: String(yearNum), // "2"  ← raw number
    year_of_study: yearLabel, // "2nd Year"  (alias)

    // ── Personal details ──────────────────────────────────────────────────
    gender: student.gender || '',
    religion: student.religion || '',
    caste: student.caste || '',
    date_of_birth: student.dob ? formatDateInWords(student.dob) : '',
    dob: student.dob ? formatDateInWords(student.dob) : '',
    dob_in_words: student.dob ? formatDateFullWords(student.dob) : '',
    date_of_birth_in_words: student.dob ? formatDateFullWords(student.dob) : '',

    // ── Status & dates ────────────────────────────────────────────────────
    status: student.admissionStatus || '',
    current_date: currentDate,
    date: currentDate,
    date_of_admission: student.admissionDate
      ? new Date(student.admissionDate).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '',
    date_of_leaving_the_institute: student.lastJoiningDate
      ? new Date(student.lastJoiningDate).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '',

    // ── Institution ──────────────────────────────────────────────────────
    college_name: COLLEGE_NAME,
  };

  console.log(
    '[Certificate] Vars built for',
    studentName,
    '| program:',
    programCode,
    '/',
    programFull,
    '| sem:',
    semStr,
    '| year:',
    yearLabel,
    '| academic_year:',
    academicYear
  );
  return vars;
}

// Replace ALL {{key}} occurrences in a template string.
// After substitution, any remaining {{key}} placeholders are logged and stripped.
function substituteVars(template, vars) {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`\\{\\{${escaped}\\}\\}`, 'g'), String(v ?? ''));
  }

  // Detect and strip any remaining unresolved placeholders
  const remaining = [...out.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)].map((m) => m[1]);
  if (remaining.length > 0) {
    console.warn('[Certificate] Unresolved placeholders — stripped:', [...new Set(remaining)]);
    out = out.replace(/\{\{[a-zA-Z0-9_]+\}\}/g, '');
  }

  return out;
}

// ── Eligibility check ─────────────────────────────────────────────────────────
// Returns an array of human-readable error strings (empty = eligible).
// Looks up the student by student_id (the USN stored on certificates).
async function checkEligibility(usn, certificateType) {
  const student = await Student.findOne({
    $or: [{ student_id: usn }, { email: usn }],
    isDeleted: { $ne: true },
  });
  if (!student) return []; // unknown USN — don't block (may be manually issued)

  const CertificateApprovalService = require('../services/certificateApproval.service');
  const evaluation = CertificateApprovalService.evaluateCertificate(certificateType, student);

  if (evaluation.isValid) return [];
  return evaluation.errors;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TEMPLATE CRUD
// ═══════════════════════════════════════════════════════════════════════════════

// ── Template helpers ──────────────────────────────────────────────────────────
// Extract unique {{key}} placeholders from HTML content
function extractTemplateKeys(html) {
  if (!html) return [];
  const matches = [...html.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)];
  return [...new Set(matches.map((m) => m[1]))];
}

// Merge fields from content with supplied field metadata.
// Keys in content win (fields not in content are dropped).
// Existing metadata (type, required, options…) is preserved for matching keys.
function syncFieldsFromNotes(notes, suppliedFields) {
  const keys = extractTemplateKeys(notes);
  if (keys.length === 0) return Array.isArray(suppliedFields) ? suppliedFields : [];
  const fieldMap = new Map((suppliedFields || []).map((f) => [f.key, f]));
  return keys.map(
    (key) =>
      fieldMap.get(key) || {
        name: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        key,
        type: 'text',
        required: false,
        editable: true,
        regex: '',
        options: [],
      }
  );
}

// ── Rebuild Puppeteer-ready HTML from template notes + images ─────────────────
// Mirrors the frontend buildFullHtml() so PDF output matches the editor preview.
// Called at PDF-generation time — fullHtml is never stored in MongoDB.
function buildTemplateHtml(tmpl) {
  const GARBAGE_RE = /xscsbcjzbjcbjkCJKJCnjcnncjxjkcnjkncj/gi;
  const notes = (tmpl.notes || '').replace(GARBAGE_RE, '');
  const images = (tmpl.images || []).map((img) => ({
    ...img,
    src: typeof img.src === 'string' ? img.src.replace(GARBAGE_RE, '') : img.src,
  }));

  const PAGE_W = 794;
  const BANNER_W = Math.round(PAGE_W * 0.7); // 556 px — same threshold as frontend
  const PAD_TOP = 60;
  const PAD_SIDE = 70;

  const sorted = [...images].sort((a, b) => a.x - b.x);
  const headerImgs = sorted.filter((img) => img.y < 200);
  const bodyImgs = sorted.filter((img) => img.y >= 200);
  const bannerImgs = headerImgs.filter((img) => img.width >= BANNER_W);
  const logoImgs = headerImgs.filter((img) => img.width < BANNER_W);

  // Banner: width:100% of .page (794px, padding:0), natural aspect-ratio height.
  const bannerHtml = bannerImgs
    .map(
      (img) =>
        `<div style="width:100%;line-height:0;overflow:hidden;display:block;">` +
        `<img src="${img.src}" style="width:100%;height:auto;display:block;" /></div>`
    )
    .join('');

  let headerTableHtml = '';
  if (logoImgs.length >= 2) {
    const L = logoImgs[0];
    const R = logoImgs[logoImgs.length - 1];
    headerTableHtml =
      `<table style="width:100%;border:none;border-collapse:collapse;margin:0 0 6px 0;table-layout:fixed;"><tr>` +
      `<td style="border:none;padding:0;text-align:left;width:${L.width}px;vertical-align:middle;">` +
      `<img src="${L.src}" width="${L.width}" height="${L.height}" style="display:block;" /></td>` +
      `<td style="border:none;padding:0;"></td>` +
      `<td style="border:none;padding:0;text-align:right;width:${R.width}px;vertical-align:middle;">` +
      `<img src="${R.src}" width="${R.width}" height="${R.height}" style="display:block;margin-left:auto;" /></td>` +
      `</tr></table>`;
  } else if (logoImgs.length === 1) {
    const img = logoImgs[0];
    const side = img.x > PAGE_W / 2 ? 'right' : 'left';
    headerTableHtml =
      `<table style="width:100%;border:none;border-collapse:collapse;margin:0 0 6px 0;"><tr>` +
      `<td style="border:none;padding:0;text-align:${side};vertical-align:middle;">` +
      `<img src="${img.src}" width="${img.width}" height="${img.height}" ` +
      `style="display:block;${side === 'right' ? 'margin-left:auto;' : ''}" /></td></tr></table>`;
  }

  const imgsHtml = bodyImgs
    .map(
      (img) =>
        `<img src="${img.src}" style="position:absolute;left:${img.x}px;top:${img.y}px;` +
        `width:${img.width}px;height:${img.height}px;z-index:10;pointer-events:none;" />`
    )
    .join('');

  const bodyContent = notes.trim()
    ? notes
    : '<p style="color:#c00;font-size:13px;border:1px dashed #c00;padding:8px;">⚠ Template body is empty — open the template editor and add certificate content, then re-issue.</p>';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    /* NO size: in @page — let page.pdf() width/height control the page dimensions */
    @page { margin: 0; }
    html { margin: 0 !important; padding: 0 !important; }
    body { margin: 0 !important; padding: 0 !important;
           font-family: Arial, sans-serif; color: #000 !important; background: white;
           -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    /* overflow:visible so content is never clipped — PDF height adapts to content */
    .page { width: 794px !important; min-height: 297mm; height: auto;
            margin: 0 !important; padding: 0 !important; box-sizing: border-box !important;
            position: relative; background: white; overflow: visible; color: #000 !important; }
    .page-body { padding: ${PAD_TOP}px ${PAD_SIDE}px; font-size: 14px; line-height: 1.7;
                 width: 100%; box-sizing: border-box; }
    .page-body * { color: #000 !important; background-color: transparent !important;
                   visibility: visible !important; opacity: 1 !important; }
    .page-body img { background-color: initial !important; }
    .page-body p, .page-body div, .page-body span,
    .page-body h1, .page-body h2, .page-body h3, .page-body h4,
    .page-body li, .page-body td, .page-body th, .page-body font { display: revert; visibility: visible !important; opacity: 1 !important; }
    .center { text-align: center; }
    .row { display: table; width: 100%; table-layout: fixed; }
    .row > * { display: table-cell; vertical-align: top; white-space: nowrap; }
    .row > *:last-child { text-align: right; }
    .page-break { page-break-after: always; break-after: page; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; vertical-align: top; }
    th { background: #f8fafc; font-weight: 600; text-align: left; }
    p { margin: 6px 0; }
    p:empty::before { content: '\\00a0'; }
  </style>
</head>
<body>
  <div class="page">
    ${bannerHtml}
    <div class="page-body">
      ${headerTableHtml}
      ${bodyContent}
    </div>
    ${imgsHtml}
  </div>
</body>
</html>`;
}

// Add computed fieldCount (from content) to a plain template object
function withFieldCount(tmpl) {
  const obj = tmpl.toObject ? tmpl.toObject() : { ...tmpl };
  obj.fieldCount = extractTemplateKeys(obj.notes).length;
  return obj;
}

// GET /api/certificates/templates
router.get('/templates', async (req, res) => {
  try {
    const filter = getTenantFilter(req.tenantId);
    const templates = await CertificateTemplate.find(filter).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: (templates || []).map(withFieldCount),
    });
  } catch (err) {
    console.error('TEMPLATES API ERROR:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
    });
  }
});

// POST /api/certificates/templates
router.post('/templates', async (req, res) => {
  try {
    const { name, description, notes, fields, status, images } = req.body;
    if (!name?.trim())
      return res.status(400).json({ success: false, error: 'Template name is required' });
    const syncedFields = syncFieldsFromNotes(notes, fields);
    const tmpl = await CertificateTemplate.create({
      name: name.trim(),
      description: description?.trim() || '',
      notes: notes || '',
      // fullHtml is NOT stored — it is rebuilt at PDF-generation time from notes + images.
      // Storing it would embed large base64 images and hit MongoDB's 16 MB document limit.
      fields: syncedFields,
      images: Array.isArray(images) ? images : [],
      status: status === 'LIVE' ? 'LIVE' : 'DRAFT',
      ...(req.tenantId && { tenantId: req.tenantId }),
    });
    res.status(201).json({ success: true, data: withFieldCount(tmpl) });
  } catch (err) {
    console.error('CREATE TEMPLATE API ERROR:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// GET /api/certificates/templates/:id
router.get('/templates/:id', async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...getTenantFilter(req.tenantId) };
    const tmpl = await CertificateTemplate.findOne(filter);
    if (!tmpl) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, data: withFieldCount(tmpl) });
  } catch (err) {
    console.error('GET TEMPLATE API ERROR:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
    });
  }
});

// PUT /api/certificates/templates/:id
router.put('/templates/:id', async (req, res) => {
  try {
    const { name, description, notes, fields, status, images } = req.body;
    // fullHtml is intentionally excluded — it is rebuilt at PDF-generation time.
    const syncedFields = syncFieldsFromNotes(notes, fields);
    const updateData = {
      name,
      description,
      notes,
      fields: syncedFields,
      status,
      images: Array.isArray(images) ? images : [],
      // Unset any previously stored fullHtml so old large documents get cleaned up
      $unset: { fullHtml: '' },
    };
    const filter = { _id: req.params.id, ...getTenantFilter(req.tenantId) };
    const tmpl = await CertificateTemplate.findOneAndUpdate(filter, updateData, {
      new: true,
      runValidators: true,
    });
    if (!tmpl) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, data: withFieldCount(tmpl) });
  } catch (err) {
    console.error('UPDATE TEMPLATE API ERROR:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
    });
  }
});

// POST /api/certificates/templates/:id/image — upload an image for a template
// Accepts multipart/form-data with field "image".
// Stores the image as a base64 data URL inside template.images[].
// Returns the new image entry so the frontend can use it immediately.
router.post('/templates/:id/image', imageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: 'No image file received. Send field name: "image".' });
    }

    const filter = { _id: req.params.id, ...getTenantFilter(req.tenantId) };
    const tmpl = await CertificateTemplate.findOne(filter);
    if (!tmpl) return res.status(404).json({ success: false, error: 'Template not found' });

    const base64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64}`;

    const newImage = {
      id: `img_${Date.now()}`,
      src: dataUrl,
      pageIndex: 0,
      x: 50,
      y: 50,
      width: 200,
      height: 150,
    };

    tmpl.images = [...(tmpl.images || []), newImage];
    await tmpl.save();

    return res.status(201).json({
      success: true,
      image: newImage,
      message: 'Image uploaded and added to template',
    });
  } catch (err) {
    if (err.message?.includes('Only image files')) {
      return res.status(400).json({ success: false, error: err.message });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/certificates/templates/:id
router.delete('/templates/:id', async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...getTenantFilter(req.tenantId) };
    const result = await CertificateTemplate.findOneAndDelete(filter);
    if (!result) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE TEMPLATE API ERROR:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  CERTIFICATE ISSUE / LIST
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/certificates?usn=xxx&studentName=xxx
router.get('/', async (req, res) => {
  try {
    const filter = { ...getTenantFilter(req.tenantId) };
    if (req.query.usn) filter.usn = req.query.usn;
    if (req.query.studentName) filter.studentName = new RegExp(req.query.studentName, 'i');

    const certificates = await Certificate.find(filter)
      .populate({
        path: 'templateId',
        select: 'name',
        strictPopulate: false,
      })
      .sort({ createdAt: -1 });

    const safeCertificates = (certificates || []).map((c) => ({
      _id: c._id,
      studentName: c.studentName || 'Unknown',
      usn: c.usn || 'N/A',
      type: c.type || c.templateId?.name || 'Certificate',
      status: c.status || 'Pending',
      validationStatus: c.validationStatus || 'PENDING',
      validationErrors: c.validationErrors || [],
      isOverridden: c.isOverridden || false,
      pdfBase64: c.pdfBase64 || null,
      generatedDate: c.generatedDate || null,
      requestedDate: c.requestedDate || null,
      templateId: c.templateId || null,
      createdAt: c.createdAt || null,
      updatedAt: c.updatedAt || null,
    }));

    res.json({
      success: true,
      data: safeCertificates,
    });
  } catch (err) {
    console.error('CERTIFICATES API ERROR:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
    });
  }
});

// POST /api/certificates/issue  — template-based issue
router.post('/issue', async (req, res) => {
  try {
    const { studentName, usn, templateId, fieldValues } = req.body;
    if (!studentName?.trim())
      return res.status(400).json({ success: false, error: 'Student name is required' });
    if (!usn?.trim()) return res.status(400).json({ success: false, error: 'USN is required' });
    if (!templateId) return res.status(400).json({ success: false, error: 'Template is required' });

    const filter = { _id: templateId, ...getTenantFilter(req.tenantId) };
    const tmpl = await CertificateTemplate.findOne(filter);
    if (!tmpl) return res.status(404).json({ success: false, error: 'Template not found' });

    // Eligibility gate
    const eligErrors = await checkEligibility(usn.trim(), tmpl.name);
    if (eligErrors.length > 0) {
      return res
        .status(400)
        .json({ success: false, error: 'Student is not eligible', eligibilityErrors: eligErrors });
    }

    // Look up the student for auto-variable expansion
    const studentDoc = await Student.findOne({
      $or: [{ student_id: usn.trim() }, { email: usn.trim() }],
      isDeleted: { $ne: true },
    });

    // Resolve tenant info for {{place}} and {{college_name}} variables
    let tenantInfo = {};
    if (req.tenantId) {
      const tenant = await Tenant.findById(req.tenantId).select('collegeAddress name').lean();
      tenantInfo = { place: tenant?.collegeAddress?.city || '', name: tenant?.name || '' };
    }

    // Build auto-variable map from student data
    const autoVars = buildAutoVars(studentDoc, studentName.trim(), usn.trim(), tenantInfo);

    // Caller-supplied fieldValues override autoVars (non-empty values only)
    const overrides = {};
    for (const [k, v] of Object.entries(fieldValues || {})) {
      if (v !== '' && v !== null && v !== undefined) overrides[k] = v;
    }
    const valMap = { ...autoVars, ...overrides };

    // Validate required fields — reject if any required field is missing in the final map
    const missingRequired = (tmpl.fields || [])
      .filter((f) => f.required && (valMap[f.key] === '' || valMap[f.key] == null))
      .map((f) => f.name || f.key);
    if (missingRequired.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingRequired.join(', ')}`,
        missingFields: missingRequired,
      });
    }
    let filledNotes = substituteVars(tmpl.notes || '', valMap);

    // Inject floating images (if any) as absolutely-positioned elements
    if (tmpl.images && tmpl.images.length > 0) {
      const imgsHtml = tmpl.images
        .map(
          (img) =>
            `<img src="${img.src}" style="position:absolute;left:${img.x}px;top:${img.y}px;` +
            `width:${img.width}px;height:${img.height}px;z-index:10;pointer-events:none;" />`
        )
        .join('');
      filledNotes = `<div style="position:relative;">${imgsHtml}${filledNotes}</div>`;
    }

    const CertificateApprovalService = require('../services/certificateApproval.service');
    const config = CertificateApprovalService.getCertificateConfig(tmpl.name);

    let initialStatus = 'Pending';
    let initialValidationStatus = 'PENDING';
    if (config.requiresValidation === false) {
      initialStatus = 'Generated';
      initialValidationStatus = 'PENDING';
    }

    const cert = await Certificate.create({
      studentName: studentName.trim(),
      usn: usn.trim(),
      type: tmpl.name,
      templateId,
      filledNotes,
      fieldValues: valMap,
      requiresValidation: config.requiresValidation !== false,
      status: initialStatus,
      validationStatus: initialValidationStatus,
      ...(req.tenantId && { tenantId: req.tenantId }),
    });

    // Auto-create Approval entry
    await Approval.create({
      studentName: cert.studentName,
      usn: cert.usn,
      certificate: cert.type,
      requestedDate: cert.requestedDate,
      certificateRef: cert._id,
      ...(req.tenantId && { tenantId: req.tenantId }),
    });

    // Audit log — fire-and-forget
    if (studentDoc?._id) {
      AuditLog.create({
        studentId: studentDoc._id,
        actionType: 'CERTIFICATE_ISSUED',
        performedBy: req.user?.email || req.headers['x-user'] || 'admin',
        metadata: { certificateType: cert.type, certId: cert._id },
        ...(req.tenantId && { tenantId: req.tenantId }),
      }).catch(() => {});
    }

    res.status(201).json({ success: true, data: cert });
  } catch (err) {
    console.error('ISSUE API ERROR:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// POST /api/certificates/create  (legacy — kept for backward compatibility)
router.post('/create', async (req, res) => {
  try {
    const { studentName, usn, type } = req.body;
    if (!studentName?.trim())
      return res.status(400).json({ success: false, error: 'Student name is required' });
    if (!usn?.trim()) return res.status(400).json({ success: false, error: 'USN is required' });
    if (!type)
      return res.status(400).json({ success: false, error: 'Certificate type is required' });

    const eligErrors = await checkEligibility(usn.trim(), type);
    if (eligErrors.length > 0) {
      return res
        .status(400)
        .json({ success: false, error: 'Student is not eligible', eligibilityErrors: eligErrors });
    }

    const CertificateApprovalService = require('../services/certificateApproval.service');
    const config = CertificateApprovalService.getCertificateConfig(type);

    let initialStatus = 'Pending';
    let initialValidationStatus = 'PENDING';
    if (config.requiresValidation === false) {
      initialStatus = 'Generated';
      initialValidationStatus = 'PENDING';
    }

    const cert = await Certificate.create({
      studentName: studentName.trim(),
      usn: usn.trim(),
      type,
      requiresValidation: config.requiresValidation !== false,
      status: initialStatus,
      validationStatus: initialValidationStatus,
    });

    await Approval.create({
      studentName: cert.studentName,
      usn: cert.usn,
      certificate: cert.type,
      requestedDate: cert.requestedDate,
      certificateRef: cert._id,
    });

    res.status(201).json({ success: true, data: cert });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/certificates/:id/approve
router.patch('/:id/approve', async (req, res) => {
  try {
    const { override, overrideReason } = req.body || {};

    let cert = await Certificate.findById(req.params.id);
    if (!cert) return res.status(404).json({ success: false, error: 'Certificate not found' });

    if (cert.status === 'Approved' || cert.status === 'Generated') {
      return res.status(400).json({ success: false, error: 'Certificate is already approved' });
    }

    const studentDoc = await Student.findOne({
      $or: [{ student_id: cert.usn }, { email: cert.usn }],
      isDeleted: { $ne: true },
    });

    if (override) {
      if (!overrideReason) {
        return res.status(400).json({ success: false, error: 'Override reason is required' });
      }
      cert.status = 'Approved';
      cert.validationStatus = 'MANUAL_APPROVED';
      cert.isOverridden = true;
      cert.overrideReason = overrideReason;
    } else {
      const evaluation = CertificateApprovalService.evaluateCertificate(cert.type, studentDoc);

      if (!evaluation.isValid) {
        cert.status = 'Rejected';
        cert.validationStatus = 'AUTO_REJECTED';
        cert.validationErrors = evaluation.errors;
        await cert.save();

        await Approval.findOneAndUpdate(
          { certificateRef: cert._id, ...(req.tenantId && { tenantId: req.tenantId }) },
          { status: 'Rejected' }
        );

        return res.status(400).json({
          success: false,
          error: 'Certificate automatically rejected due to failed validation rules',
          validationErrors: evaluation.errors,
        });
      }

      cert.status = 'Approved';
      cert.validationStatus = 'AUTO_APPROVED';
      cert.validationErrors = [];
    }

    cert = await cert.save();

    // Update the associated approval document
    const filter = { certificateRef: cert._id, ...getTenantFilter(req.tenantId) };
    await Approval.findOneAndUpdate(filter, { status: 'Approved' });

    // Audit log — resolve student from USN then log
    Student.findOne({
      $or: [{ student_id: cert.usn }, { email: cert.usn }],
      isDeleted: { $ne: true },
    })
      .select('_id')
      .lean()
      .then((s) => {
        if (!s) return;
        return AuditLog.create({
          studentId: s._id,
          actionType: 'CERTIFICATE_APPROVED',
          performedBy: req.user?.email || req.headers['x-user'] || 'admin',
          metadata: { certificateType: cert.type, certId: cert._id },
          ...(req.tenantId && { tenantId: req.tenantId }),
        });
      })
      .catch(() => {});

    console.log(
      '[Puppeteer] Successfully updated certificate status to "Approved". (PDF will generate on download)'
    );
    res.json({ success: true, data: cert });
  } catch (err) {
    console.error('APPROVE API ERROR:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// PATCH /api/certificates/:id/reject
router.patch('/:id/reject', async (req, res) => {
  try {
    const cert = await Certificate.findByIdAndUpdate(
      req.params.id,
      { status: 'Rejected' },
      { new: true }
    );
    const filter = { certificateRef: cert._id, ...getTenantFilter(req.tenantId) };
    await Approval.findOneAndUpdate(filter, { status: 'Rejected' });

    // Audit log — fire-and-forget
    Student.findOne({
      $or: [{ student_id: cert.usn }, { email: cert.usn }],
      isDeleted: { $ne: true },
    })
      .select('_id')
      .lean()
      .then((s) => {
        if (!s) return;
        return AuditLog.create({
          studentId: s._id,
          actionType: 'CERTIFICATE_REJECTED',
          performedBy: req.user?.email || req.headers['x-user'] || 'admin',
          metadata: { certificateType: cert.type, certId: cert._id },
          ...(req.tenantId && { tenantId: req.tenantId }),
        });
      })
      .catch(() => {});

    res.json({ success: true, data: cert });
  } catch (err) {
    console.error('REJECT API ERROR:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  PDF GENERATION (Puppeteer — renders actual HTML/CSS)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── PDF Generation Helper ────────────────────────────────────────────────────
/**
 * Shared logic to generate a PDF for a certificate.
 * Assumes validation has already been performed by the caller.
 */
async function performPdfGeneration(cert, req, res) {
  let browser;
  try {
    let tmpl = cert.templateId; // populated object or null
    if (!tmpl && cert.type) {
      const normalizedType = cert.type.replace(/_/g, ' ').trim();
      tmpl = await CertificateTemplate.findOne({
        name: {
          $regex: new RegExp(`^${normalizedType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        },
      });
      if (!tmpl) {
        const keyword = normalizedType.split(/\s+/)[0];
        tmpl = await CertificateTemplate.findOne({
          name: { $regex: new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
        });
      }
    }

    if (!tmpl) {
      return res.status(400).json({
        success: false,
        error: 'PDF generation failed: Template not found. Please re-issue the certificate.',
      });
    }

    const student = await Student.findOne({
      $or: [{ student_id: cert.usn }, { email: cert.usn }],
      isDeleted: { $ne: true },
    });

    // Resolve tenant info for place/college_name
    let tenantInfo = {};
    if (cert.tenantId) {
      const tenant = await Tenant.findById(cert.tenantId).select('collegeAddress name').lean();
      tenantInfo = { place: tenant?.collegeAddress?.city || '', name: tenant?.name || '' };
    }

    const autoVars = buildAutoVars(student, cert.studentName, cert.usn, tenantInfo);
    const storedFieldValues =
      cert.fieldValues instanceof Map
        ? Object.fromEntries(cert.fieldValues)
        : cert.fieldValues || {};
    const vars = { ...autoVars, ...storedFieldValues };

    const cleanNotes = (tmpl.notes || '').replace(
      /\bbackground(?:-color)?\s*:[^;}"']+/gi,
      'background-color:transparent'
    );
    const tmplForPdf = { ...(tmpl.toObject ? tmpl.toObject() : tmpl), notes: cleanNotes };

    const htmlContent = buildTemplateHtml(tmplForPdf);
    const finalHTML = substituteVars(htmlContent, vars);

    const options = await getLaunchOptions();
    const puppeteer = require('puppeteer-core');
    browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    await page.setViewport({
      width: 794,
      height: 1122,
      deviceScaleFactor: 1,
    });
    await page.setContent(finalHTML, { waitUntil: 'networkidle0' });

    await page.emulateMediaType('screen');

    const pdfRaw = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      displayHeaderFooter: false,
      preferCSSPageSize: true,
    });
    const pdfBuffer = Buffer.isBuffer(pdfRaw) ? pdfRaw : Buffer.from(pdfRaw);

    await browser.close();
    browser = null;

    if (cert.status !== 'Generated') {
      await Certificate.findByIdAndUpdate(cert._id, {
        status: 'Generated',
        generatedDate: new Date(),
      });
    }

    const safeName = `${(cert.type || 'Certificate').replace(/\s+/g, '_')}_${cert.usn}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF GENERATION ERROR:', err);
    if (browser) await browser.close().catch(() => {});
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'PDF generation failed: ' + err.message });
    }
  }
}

// GET /api/certificates/:id/download — SECURE DOWNLOAD
router.get('/:id/download', async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id).populate('templateId');
    if (!cert) return res.status(404).json({ success: false, error: 'Certificate not found' });

    // 1. Recovery & Initial status check
    if (cert.status === 'Rejected' && cert.validationStatus === 'AUTO_REJECTED') {
      console.log(
        `[Lifecycle] Attempting self-healing recovery for rejected certificate ${cert._id}...`
      );
      const student = await Student.findOne({
        $or: [{ student_id: cert.usn }, { email: cert.usn }],
        isDeleted: { $ne: true },
      });

      if (student) {
        const evaluation = CertificateApprovalService.evaluateCertificate(cert.type, student);
        if (evaluation.isValid) {
          console.log(`[Lifecycle] SUCCESS: Certificate ${cert._id} recovered automatically!`);
          cert.status = 'Approved'; // Setting to Approved so it can be Generated below
          cert.validationStatus = 'AUTO_APPROVED';
          cert.validationErrors = [];
          await cert.save();
        }
      }
    }

    if (cert.status !== 'Approved' && cert.status !== 'Generated') {
      console.warn(
        `[Security] Blocked download attempt for certificate ${cert._id} (Status: ${cert.status})`
      );
      const defaultReason =
        cert.status === 'Rejected'
          ? 'This certificate is rejected'
          : 'Certificate is pending approval';
      return res.status(403).json({
        success: false,
        message: 'Certificate cannot be generated',
        reason:
          cert.validationErrors?.length > 0 ? cert.validationErrors.join(', ') : defaultReason,
        errors: [defaultReason],
      });
    }

    // 2. Fetch latest student data for live validation (even if Approved/Generated)
    const student = await Student.findOne({
      $or: [{ student_id: cert.usn }, { email: cert.usn }],
      isDeleted: { $ne: true },
    });

    if (!student) {
      return res.status(404).json({ success: false, error: 'Associated student record not found' });
    }

    // 3. Live Validation (Skip if admin override exists or no validation required)
    if (!cert.isOverridden && cert.requiresValidation !== false) {
      const evaluation = CertificateApprovalService.evaluateCertificate(cert.type, student);
      if (!evaluation.isValid) {
        console.warn(
          `[Security] Blocked download attempt for certificate ${cert._id} (Validation failed)`
        );

        // Return to rejected state if validation fails at download time
        cert.status = 'Rejected';
        cert.validationStatus = 'AUTO_REJECTED';
        cert.validationErrors = evaluation.errors;
        await cert.save();

        return res.status(403).json({
          success: false,
          message: 'Certificate cannot be generated',
          reason: evaluation.errors.join(', '),
          errors: evaluation.errors,
        });
      }
    } else {
      console.log(`[Security] Admin override detected for ${cert._id} — bypassing live validation`);
    }

    // 4. Success — proceed to generate
    await performPdfGeneration(cert, req, res);
  } catch (err) {
    console.error('DOWNLOAD API ERROR:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/certificates/:id/revalidate — Trigger a re-check of eligibility
router.post('/:id/revalidate', async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id);
    if (!cert) return res.status(404).json({ success: false, error: 'Certificate not found' });

    const student = await Student.findOne({
      $or: [{ student_id: cert.usn }, { email: cert.usn }],
      isDeleted: { $ne: true },
    });
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

    const evaluation = CertificateApprovalService.evaluateCertificate(cert.type, student);

    if (evaluation.isValid) {
      cert.status = 'Approved';
      cert.validationStatus = 'AUTO_APPROVED';
      cert.validationErrors = [];
    } else {
      cert.status = 'Rejected';
      cert.validationStatus = 'AUTO_REJECTED';
      cert.validationErrors = evaluation.errors;
    }

    await cert.save();
    res.json({ success: true, data: cert });
  } catch (err) {
    console.error('REVALIDATE API ERROR:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/certificates/pdf/:id — Backwards compatibility (now points to secure download)
router.get('/pdf/:id', (req, res) => {
  res.redirect(307, `/api/certificates/${req.params.id}/download`);
});

// ═══════════════════════════════════════════════════════════════════════════════
//  PDF → HTML CONVERSION  (for "Upload PDF Template" feature)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convert raw text extracted by pdf-parse into structured HTML.
 * Strategy:
 *  - Blank lines  → paragraph breaks
 *  - ALL-CAPS lines that are short → treat as headings
 *  - Lines ending with ':' and short → treat as sub-headings
 *  - Everything else → <p>
 */
/*
function textToHtml(rawText) {
  // Normalise line endings
  const lines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const parts = [];
  let paraLines = [];

  const flushPara = () => {
    if (paraLines.length) {
      parts.push(`<p>${paraLines.join(' ')}</p>`);
      paraLines = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) { flushPara(); continue; }

    // Detect likely heading: short ALL-CAPS or ends with ':'
    const isHeading = line.length < 80 &&
      (/^[A-Z0-9][A-Z0-9 /()&,.:-]+$/.test(line) || line.endsWith(':'));

    if (isHeading) {
      flushPara();
      if (line.endsWith(':')) {
        parts.push(`<h2>${escHtml(line)}</h2>`);
      } else {
        parts.push(`<h1>${escHtml(line)}</h1>`);
      }
    } else {
      paraLines.push(escHtml(line));
    }
  }
  flushPara();
  return parts.join('\n') || '<p>PDF content could not be extracted. Please add content manually.</p>';
}

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
*/

// POST /api/certificates/templates/upload-pdf
// Accepts a PDF (field name: "pdf"), extracts text via OCR, returns HTML for the editor.
router.post('/templates/upload-pdf', pdfUpload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No PDF file uploaded. Send the file under the field name "pdf".',
    });
  }
  if (req.file.mimetype !== 'application/pdf') {
    return res.status(400).json({ success: false, error: 'Only PDF files are accepted.' });
  }

  let html = '';
  let usedOcr = false;
  let warning = null;
  let worker;

  try {
    const { createWorker } = require('tesseract.js');
    worker = await createWorker('eng');

    // Tesseract accepts a Buffer — works best for image-embedded PDFs.
    const { data: ocrData } = await worker.recognize(req.file.buffer);
    const ocrText = (ocrData.text || '').trim();

    if (ocrText.length >= 5) {
      // Wrap each non-empty line as a paragraph so the editor shows clean content
      const lines = ocrText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => `<p>${l}</p>`)
        .join('\n');
      html = `<div>${lines}</div>`;
      usedOcr = true;
      warning =
        '⚠ OCR was used — layout may differ from the original. Please review and adjust content.';
    } else {
      html = '<p>No text could be extracted. Please type your content here.</p>';
      warning = '⚠ No readable text was found in the PDF. Add content manually.';
    }
  } catch (err) {
    console.error('[upload-pdf] OCR error:', err.message);
    html = '<p>PDF processing failed. Please add your content manually.</p>';
    warning = '⚠ PDF processing failed. Add content manually.';
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        /* ignore */
      }
    }
  }

  return res.json({ success: true, html, pages: 1, usedOcr, warning });
});

module.exports = router;
