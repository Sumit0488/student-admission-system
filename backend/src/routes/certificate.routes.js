const express = require('express');
const router = express.Router();
const multer = require('multer');
// const pdfParse             = require('pdf-parse');
const CHROMIUM_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v143.0.0/chromium-v143.0.0-pack.tar';

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
const { getTenantFilter } = require('../utils/tenantFilter');

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
function buildAutoVars(student, fallbackName, fallbackUsn) {
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
      place: 'Davanagere',
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
    place: student.city || 'Davanagere',

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

  const errors = [];
  if (student.admissionStatus !== 'Live') {
    errors.push(
      `Student status is "${student.admissionStatus}" — only Live students can receive certificates`
    );
  }
  if (student.isDebarred) {
    errors.push('Student is debarred — certificates cannot be issued');
  }
  if (!student.feesCleared) {
    errors.push('Fees not cleared — please settle outstanding dues first');
  }
  if (student.attendanceCleared === false) {
    errors.push('Attendance not cleared — minimum attendance requirement not met');
  }
  if (student.examPassed === false) {
    errors.push('Exam not passed — all examinations must be cleared');
  }
  if (student.noDues === false) {
    errors.push('Dues pending — all dues must be cleared before issuing certificates');
  }
  if (certificateType === 'Transfer Certificate' && !student.feesCleared) {
    errors.push('Transfer Certificate requires all fees to be cleared');
  }
  return errors;
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
  const notes = tmpl.notes || '';
  const images = tmpl.images || [];

  const PAGE_W = 794;
  const BANNER_W = Math.round(PAGE_W * 0.7); // 556 px — same threshold as frontend
  const PAD_TOP = 60;
  const PAD_SIDE = 70;

  const sorted = [...images].sort((a, b) => a.x - b.x);
  const headerImgs = sorted.filter((img) => img.y < 200);
  const bodyImgs = sorted.filter((img) => img.y >= 200);
  const bannerImgs = headerImgs.filter((img) => img.width >= BANNER_W);
  const logoImgs = headerImgs.filter((img) => img.width < BANNER_W);

  const bannerHtml = bannerImgs
    .map(
      (img) =>
        `<div style="margin:-${PAD_TOP}px -${PAD_SIDE}px 12px -${PAD_SIDE}px;line-height:0;">` +
        `<img src="${img.src}" style="width:100%;display:block;" /></div>`
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

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    @page { margin: 0; size: A4 portrait; }
    body { margin: 0 !important; padding: 0 !important; font-family: Arial, sans-serif; color: #000 !important; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { width: 210mm !important; min-height: 297mm; height: auto; margin: 0 auto !important; padding: 60px 70px; box-sizing: border-box !important; position: relative; background: white; overflow: visible; font-size: 14px; line-height: 1.7; color: #000 !important; }
    .page * { color: #000 !important; background-color: transparent !important; }
    .page img { background-color: initial !important; }
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
    .header { width: 100% !important; }
    .header img { width: 100% !important; display: block; }
  </style>
</head>
<body>
  <div class="page">
    ${bannerHtml}
    ${headerTableHtml}
    ${notes}
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

    // Build auto-variable map from student data
    const autoVars = buildAutoVars(studentDoc, studentName.trim(), usn.trim());

    // Caller-supplied fieldValues override autoVars, but only when non-empty
    // (empty strings from the UI form must not overwrite backend-computed values)
    const overrides = {};
    for (const [k, v] of Object.entries(fieldValues || {})) {
      if (v !== '' && v !== null && v !== undefined) overrides[k] = v;
    }
    const valMap = { ...autoVars, ...overrides };
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

    const cert = await Certificate.create({
      studentName: studentName.trim(),
      usn: usn.trim(),
      type: tmpl.name,
      templateId,
      filledNotes,
      fieldValues: valMap,
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

    const cert = await Certificate.create({
      studentName: studentName.trim(),
      usn: usn.trim(),
      type,
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
    let cert = await Certificate.findById(req.params.id);
    if (!cert) return res.status(404).json({ success: false, error: 'Certificate not found' });

    cert.status = 'Approved';
    cert = await cert.save();

    // Update the associated approval document
    const filter = { certificateRef: cert._id, ...getTenantFilter(req.tenantId) };
    await Approval.findOneAndUpdate(filter, { status: 'Approved' });

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
    res.json({ success: true, data: cert });
  } catch (err) {
    console.error('REJECT API ERROR:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  PDF GENERATION (Puppeteer — renders actual HTML/CSS)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/certificates/pdf/:id
router.get('/pdf/:id', async (req, res) => {
  let browser;
  try {
    console.log('PDF API HIT', req.params.id);

    const cert = await Certificate.findById(req.params.id).populate('templateId');
    if (!cert) return res.status(404).json({ success: false, error: 'Certificate not found' });

    if (cert.status !== 'Approved' && cert.status !== 'Generated') {
      return res.status(403).json({
        success: false,
        error:
          cert.status === 'Rejected'
            ? 'This certificate has been rejected and cannot be downloaded.'
            : 'Certificate is pending approval. Download is available once approved.',
      });
    }

    let tmpl = cert.templateId; // populated object or null
    if (!tmpl && cert.type) {
      // Normalise: underscores → spaces, trim
      const normalizedType = cert.type.replace(/_/g, ' ').trim();
      // 1st try: exact name match (case-insensitive)
      tmpl = await CertificateTemplate.findOne({
        name: {
          $regex: new RegExp(`^${normalizedType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        },
      });
      // 2nd try: template name *contains* the cert type keyword (handles "bonafide" → "Bonafide Certificate")
      if (!tmpl) {
        const keyword = normalizedType.split(/\s+/)[0]; // first word
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

    // 🔥 Get student data to fill variables live
    const student = await Student.findOne({
      $or: [{ student_id: cert.usn }, { email: cert.usn }],
      isDeleted: { $ne: true },
    });

    const vars = buildAutoVars(student, cert.studentName, cert.usn);

    // Warn if template has no body text — helps diagnose blank PDFs
    const rawNotes = (tmpl.notes || '').trim();
    if (!rawNotes) {
      console.warn('[PDF] Template "%s" has empty notes — PDF body will be blank', tmpl.name);
    }

    // Strip dark-mode inline colors that would render invisible on white PDF background.
    // This normalises pasted content that carries dark-theme background/foreground styles.
    const cleanNotes = (tmpl.notes || '').replace(
      /\bbackground(?:-color)?\s*:[^;}"']+/gi,
      'background-color:transparent'
    );
    const tmplForPdf = { ...(tmpl.toObject ? tmpl.toObject() : tmpl), notes: cleanNotes };

    // Always rebuild HTML from notes + images — fullHtml is no longer stored in DB.
    const htmlContent = buildTemplateHtml(tmplForPdf);
    const finalHTML = substituteVars(htmlContent, vars);

    // 🔥 Generate PDF using Puppeteer on-the-fly
    const options = await getLaunchOptions();
    const puppeteer = require('puppeteer-core');
    browser = await puppeteer.launch(options);
    const page = await browser.newPage();

    // Set viewport to exactly match the A4 page pixel dimensions used in the
    // template editor (794 × 1123 @ 96 DPI).  Without this, Puppeteer uses its
    // default 800 × 600 viewport, which can cause subtle scaling differences
    // that shift absolute-positioned images relative to the text content.
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    // Switch to print media BEFORE setContent so @page{margin:0} is honoured
    // and the banner's negative-margin bleed reaches the physical page edge.
    await page.emulateMediaType('print');

    // Inject CSS that matches the editor exactly — same line-height and margins
    // so the preview and PDF render identically.
    const fixedHTML = finalHTML.replace(
      '</head>',
      '<style>' +
        '@page{margin:0!important;size:A4 portrait;}' +
        'html{margin:0!important;padding:0!important;}' +
        'body{margin:0!important;padding:0!important;font-family:Arial,sans-serif;' +
        'color:#000!important;background:white;}' +
        '.page{width:210mm!important;min-height:297mm!important;height:auto!important;' +
        'overflow:visible!important;box-sizing:border-box!important;' +
        'padding:60px 70px!important;page-break-after:avoid!important;' +
        'margin:0 auto!important;color:#000!important;background:white!important;}' +
        '.page *{color:#000!important;background-color:transparent!important;}' +
        '.page img{background-color:initial!important;}' +
        '.header{width:100%!important;}' +
        '.header img{width:100%!important;display:block;}' +
        'p{margin:6px 0!important;line-height:1.7!important;}' +
        'p:empty::before{content:"\\00a0";}' +
        'img{max-width:100%;}' +
        '.page-break{page-break-after:always!important;break-after:page!important;}' +
        '</style></head>'
    );
    await page.setContent(fixedHTML, { waitUntil: 'networkidle0' });

    // Measure the actual rendered height of .page and compute a scale factor
    // so the content always fits within a single A4 page (1123 px at 96 DPI).
    const A4_PX = 1123;
    const contentHeight = await page.evaluate(() => {
      const el = document.querySelector('.page');
      return el ? el.scrollHeight : document.body.scrollHeight;
    });
    const scale = contentHeight > A4_PX ? parseFloat((A4_PX / contentHeight).toFixed(4)) : 1;
    console.log(`[PDF] content height: ${contentHeight}px  →  scale: ${scale}`);

    // Apply scaling via CSS zoom instead of page.pdf({scale}).
    // page.pdf({scale < 1}) anchors from the top-left, leaving blank space on
    // the right equal to (1 - scale) × pageWidth.  CSS zoom shrinks the element
    // while the flex body keeps it horizontally centred.
    if (scale < 1) {
      await page.evaluate((s) => {
        const el = document.querySelector('.page');
        if (el) el.style.zoom = String(s);
      }, scale);
    }

    const pdfRaw = await page.pdf({
      format: 'A4',
      printBackground: true,
      scale: 1, // always 1 — scaling is handled via CSS zoom above
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    const pdfBuffer = Buffer.isBuffer(pdfRaw) ? pdfRaw : Buffer.from(pdfRaw);

    await browser.close();
    browser = null;

    // Stamp generatedDate + status on the certificate now that the PDF is ready
    await Certificate.findByIdAndUpdate(cert._id, {
      status: 'Generated',
      generatedDate: new Date(),
    });

    const safeName = `${(cert.type || 'Certificate').replace(/\s+/g, '_')}_${cert.usn}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF API ERROR:', err);
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        /* ignore */
      }
    }
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'PDF generation failed: ' + err.message });
    }
  }
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
