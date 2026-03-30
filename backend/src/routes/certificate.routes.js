const express              = require('express');
const router               = express.Router();
const multer               = require('multer');
const pdfParse             = require('pdf-parse');
const { createWorker }     = require('tesseract.js');
const puppeteer            = require('puppeteer-core');
const chromium             = require('@sparticuz/chromium-min');

// On Vercel (production) use @sparticuz/chromium-min; locally use the system Chrome
const CHROMIUM_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v143.0.0/chromium-v143.0.0-pack.tar';

async function getLaunchOptions() {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return {
      args:            chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath:  await chromium.executablePath(CHROMIUM_URL),
      headless:        chromium.headless,
    };
  }
  // Local dev — use the Chromium that puppeteer downloaded
  const localPuppeteer = require('puppeteer');
  return {
    executablePath: localPuppeteer.executablePath(),
    headless:       true,
    args:           ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  };
}
const Certificate          = require('../models/certificate.model');
const CertificateTemplate  = require('../models/certificate-template.model');
const Approval             = require('../models/approval.model');
const Student              = require('../models/student.model');

// multer — memory storage (no temp files), 10 MB limit, PDF only
const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are accepted'));
  },
});

// ── Program name lookups ──────────────────────────────────────────────────────
const PROGRAM_NAMES = {
  CSE:   'Computer Science and Engineering',
  ECE:   'Electronics and Communication Engineering',
  MECH:  'Mechanical Engineering',
  CIVIL: 'Civil Engineering',
  MBA:   'Master of Business Administration',
  MCA:   'Master of Computer Applications',
  EEE:   'Electrical and Electronics Engineering',
  ISE:   'Information Science and Engineering',
  AIML:  'Artificial Intelligence and Machine Learning',
  AIDS:  'Artificial Intelligence and Data Science',
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

// Build a variable map from a Student document for template auto-fill
function buildAutoVars(student, fallbackName, fallbackUsn) {
  const today = new Date();
  const currentDate = today.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  if (!student) {
    const y = new Date().getFullYear();
    const ay = `${y}-${String(y + 1).slice(-2)}`;
    return {
      student_name:  fallbackName,
      name:          fallbackName,
      usn:           fallbackUsn,
      roll_no:       fallbackUsn,
      roll_number:   fallbackUsn,
      academic_year: ay,
      accademic_year: ay,
      batch:         ay,
      current_date:  currentDate,
      date:          currentDate,
      place:         'Davanagere',
    };
  }

  // Dynamic term: (currentYear - batchYear) * 2 + base (1=Regular, 3=Lateral), cap at 8
  const calcSem = () => {
    const batchYear = parseInt((student.batch || '').split('-')[0], 10);
    if (isNaN(batchYear)) return student.term ?? 1;
    const base = (student.admissionCategory || '').toLowerCase() === 'lateral' ? 3 : 1;
    return Math.min(Math.max((new Date().getFullYear() - batchYear) * 2 + base, base), 8);
  };
  const sem          = calcSem();
  const semStr       = String(sem);
  const semOrd       = ORDINALS[sem] ? `${ORDINALS[sem]} Semester` : `${sem}th Semester`;
  const yearNum      = Math.ceil(sem / 2);                       // 1–4
  const yearOrd      = YEAR_ORDINALS[yearNum] || `${yearNum}th`;
  const yearLabel    = `${yearOrd} Year`;                        // "1st Year", "2nd Year" …
  const studentName  = student.fullName || fallbackName;
  const usnVal       = student.student_id || fallbackUsn;
  const programName  = student.program || '';
  const programCode  = getProgramCode(programName);              // "CSE", "ECE" …
  const programFull  = getFullProgramName(programName);          // "Computer Science and Engineering" …
  // academic_year: use batch if set, else build from current calendar year
  const academicYear = student.batch || (() => {
    const y = new Date().getFullYear();
    return `${y}-${String(y + 1).slice(-2)}`;
  })();

  const vars = {
    // ── Student identity ───────────────────────────────────────────────────
    student_name:      studentName,
    name:              studentName,
    usn:               usnVal,
    roll_no:           usnVal,
    roll_number:       usnVal,
    father_name:       student.fatherName  || '',
    email:             student.email       || '',
    phone:             student.phone       || '',
    address:           student.address     || '',
    place:             student.address ? student.address.split(',').pop().trim() : 'Davanagere',

    // ── Academic ───────────────────────────────────────────────────────────
    program:           programCode,          // short code: "CSE", "ECE" …
    program_full_name: programFull,          // "Computer Science and Engineering" …
    branch:            programFull,          // alias → full name
    department:        programFull,          // alias → full name
    program_code:      programCode,          // explicit code alias
    degree:            student.degree      || '',
    batch:             student.batch       || academicYear,
    academic_year:     academicYear,
    accademic_year:    academicYear,         // common typo alias

    // ── Term / semester / year ─────────────────────────────────────────────
    semester:          semStr,               // "3"
    sem:               semStr,               // alias
    current_term:      semOrd,               // "3rd Semester"
    year:              yearLabel,            // "2nd Year"  ← formatted
    year_number:       String(yearNum),      // "2"  ← raw number
    year_of_study:     yearLabel,            // "2nd Year"  (alias)

    // ── Status & dates ────────────────────────────────────────────────────
    status:            student.admissionStatus || '',
    current_date:      currentDate,
    date:              currentDate,
  };

  console.log('[Certificate] Vars built for', studentName, '| program:', programCode, '/', programFull, '| sem:', semStr, '| year:', yearLabel, '| academic_year:', academicYear);
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
  if (!student) return [];  // unknown USN — don't block (may be manually issued)

  const errors = [];
  if (student.admissionStatus !== 'Live') {
    errors.push(`Student status is "${student.admissionStatus}" — only Live students can receive certificates`);
  }
  if (student.isDebarred) {
    errors.push('Student is debarred — certificates cannot be issued');
  }
  if (!student.feesCleared) {
    errors.push('Fees not cleared — please settle outstanding dues first');
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
  return keys.map((key) => fieldMap.get(key) || {
    name:     key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    key,
    type:     'text',
    required: false,
    editable: true,
    regex:    '',
    options:  [],
  });
}

// Add computed fieldCount (from content) to a plain template object
function withFieldCount(tmpl) {
  const obj = tmpl.toObject ? tmpl.toObject() : { ...tmpl };
  obj.fieldCount = extractTemplateKeys(obj.notes).length;
  return obj;
}

// GET /api/certificates/templates
router.get('/templates', async (_req, res) => {
  try {
    const docs = await CertificateTemplate.find().sort({ createdAt: -1 });
    res.json({ success: true, data: docs.map(withFieldCount) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/certificates/templates
router.post('/templates', async (req, res) => {
  try {
    const { name, description, notes, fields, status, images } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'Template name is required' });
    const syncedFields = syncFieldsFromNotes(notes, fields);
    const tmpl = await CertificateTemplate.create({
      name:        name.trim(),
      description: description?.trim() || '',
      notes:       notes  || '',
      fields:      syncedFields,
      images:      Array.isArray(images) ? images : [],
      status:      status === 'LIVE' ? 'LIVE' : 'DRAFT',
    });
    res.status(201).json({ success: true, data: withFieldCount(tmpl) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/certificates/templates/:id
router.get('/templates/:id', async (req, res) => {
  try {
    const tmpl = await CertificateTemplate.findById(req.params.id);
    if (!tmpl) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, data: withFieldCount(tmpl) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /api/certificates/templates/:id
router.put('/templates/:id', async (req, res) => {
  try {
    const { name, description, notes, fields, status, images } = req.body;
    const syncedFields = syncFieldsFromNotes(notes, fields);
    const tmpl = await CertificateTemplate.findByIdAndUpdate(
      req.params.id,
      { name, description, notes, fields: syncedFields, status, images: Array.isArray(images) ? images : [] },
      { new: true, runValidators: true },
    );
    if (!tmpl) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, data: withFieldCount(tmpl) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /api/certificates/templates/:id
router.delete('/templates/:id', async (req, res) => {
  try {
    await CertificateTemplate.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  CERTIFICATE ISSUE / LIST
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/certificates?usn=xxx&studentName=xxx
router.get('/', async (_req, res) => {
  try {
    const filter = {};
    if (_req.query.usn)          filter.usn         = _req.query.usn;
    if (_req.query.studentName)  filter.studentName = new RegExp(_req.query.studentName, 'i');
    const data = await Certificate.find(filter).populate('templateId', 'name').sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/certificates/issue  — template-based issue
router.post('/issue', async (req, res) => {
  try {
    const { studentName, usn, templateId, fieldValues } = req.body;
    if (!studentName?.trim()) return res.status(400).json({ success: false, error: 'Student name is required' });
    if (!usn?.trim())         return res.status(400).json({ success: false, error: 'USN is required' });
    if (!templateId)          return res.status(400).json({ success: false, error: 'Template is required' });

    const tmpl = await CertificateTemplate.findById(templateId);
    if (!tmpl) return res.status(404).json({ success: false, error: 'Template not found' });

    // Eligibility gate
    const eligErrors = await checkEligibility(usn.trim(), tmpl.name);
    if (eligErrors.length > 0) {
      return res.status(400).json({ success: false, error: 'Student is not eligible', eligibilityErrors: eligErrors });
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
    let   filledNotes = substituteVars(tmpl.notes || '', valMap);

    // Inject floating images (if any) as absolutely-positioned elements
    if (tmpl.images && tmpl.images.length > 0) {
      const imgsHtml = tmpl.images.map((img) =>
        `<img src="${img.src}" style="position:absolute;left:${img.x}px;top:${img.y}px;` +
        `width:${img.width}px;height:${img.height}px;z-index:10;pointer-events:none;" />`
      ).join('');
      filledNotes = `<div style="position:relative;">${imgsHtml}${filledNotes}</div>`;
    }

    const cert = await Certificate.create({
      studentName: studentName.trim(),
      usn:         usn.trim(),
      type:        tmpl.name,
      templateId,
      filledNotes,
      fieldValues: valMap,
    });

    // Auto-create Approval entry
    await Approval.create({
      studentName:   cert.studentName,
      usn:           cert.usn,
      certificate:   cert.type,
      requestedDate: cert.requestedDate,
      certificateRef: cert._id,
    });

    res.status(201).json({ success: true, data: cert });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/certificates/create  (legacy — kept for backward compatibility)
router.post('/create', async (req, res) => {
  try {
    const { studentName, usn, type } = req.body;
    if (!studentName?.trim()) return res.status(400).json({ success: false, error: 'Student name is required' });
    if (!usn?.trim())         return res.status(400).json({ success: false, error: 'USN is required' });
    if (!type)                return res.status(400).json({ success: false, error: 'Certificate type is required' });

    const eligErrors = await checkEligibility(usn.trim(), type);
    if (eligErrors.length > 0) {
      return res.status(400).json({ success: false, error: 'Student is not eligible', eligibilityErrors: eligErrors });
    }

    const cert = await Certificate.create({ studentName: studentName.trim(), usn: usn.trim(), type });

    await Approval.create({
      studentName:   cert.studentName,
      usn:           cert.usn,
      certificate:   cert.type,
      requestedDate: cert.requestedDate,
      certificateRef: cert._id,
    });

    res.status(201).json({ success: true, data: cert });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PATCH /api/certificates/:id/approve
router.patch('/:id/approve', async (req, res) => {
  try {
    const cert = await Certificate.findByIdAndUpdate(
      req.params.id, { status: 'Approved' }, { new: true }
    );
    if (!cert) return res.status(404).json({ success: false, error: 'Certificate not found' });
    await Approval.findOneAndUpdate({ certificateRef: cert._id }, { status: 'Approved' });
    res.json({ success: true, data: cert });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PATCH /api/certificates/:id/reject
router.patch('/:id/reject', async (req, res) => {
  try {
    const cert = await Certificate.findByIdAndUpdate(
      req.params.id, { status: 'Rejected' }, { new: true }
    );
    if (!cert) return res.status(404).json({ success: false, error: 'Certificate not found' });
    await Approval.findOneAndUpdate({ certificateRef: cert._id }, { status: 'Rejected' });
    res.json({ success: true, data: cert });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  PDF GENERATION (Puppeteer — renders actual HTML/CSS)
// ═══════════════════════════════════════════════════════════════════════════════

// Build the full certificate HTML page
function buildCertHtml(cert, issuedOn) {
  const body = cert.filledNotes
    ? cert.filledNotes
    : `<p>This is to certify that <strong>${cert.studentName}</strong> bearing University Seat Number (USN) <strong>${cert.usn}</strong> is a bonafide student of EduAdmin Institute.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1e293b; background: #fff; }

  .header { background: #1D4ED8; color: #fff; padding: 22px 60px; text-align: center; }
  .header .sys  { font-size: 9px; letter-spacing: 2px; opacity: .8; text-transform: uppercase; }
  .header .inst { font-size: 21px; font-weight: 700; margin: 4px 0 2px; }
  .header .aff  { font-size: 9px; opacity: .7; }

  .body { padding: 32px 60px 40px; }

  .cert-title { font-size: 20px; font-weight: 700; color: #1D4ED8; text-align: center;
                text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .divider { border: none; border-top: 2px solid #1D4ED8; margin: 0 20px 24px; }

  .content { font-size: 12px; line-height: 1.75; }
  .content h1 { font-size: 18px; font-weight: 700; margin: 14px 0 8px; }
  .content h2 { font-size: 15px; font-weight: 600; margin: 12px 0 6px; }
  .content p  { margin: 4px 0; }
  .content ul, .content ol { padding-left: 22px; margin: 6px 0; }
  .content li { margin: 2px 0; }
  .content hr { border: none; border-top: 1px solid #cbd5e1; margin: 12px 0; }

  /* Tables rendered exactly as in editor */
  .content table { width: 100%; border-collapse: collapse; margin: 10px 0; table-layout: auto; }
  .content td, .content th {
    border: 1px solid #334155; padding: 6px 10px;
    vertical-align: top; word-break: break-word; font-size: 11px;
  }
  .content th { background: #f1f5f9; font-weight: 600; }

  .footer-date { margin-top: 20px; font-size: 11px; }
  .footer-sig  { margin-top: 36px; text-align: right; }
  .footer-sig .name { font-size: 12px; font-weight: 700; }
  .footer-sig .sub  { font-size: 10px; color: #64748b; margin-top: 2px; }
  .cert-id { margin-top: 28px; font-size: 8px; color: #94a3b8;
             display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 6px; }
</style>
</head>
<body>
  <div class="header">
    <div class="sys">Admission Management System</div>
    <div class="inst">EduAdmin Institute</div>
    <div class="aff">Approved by AICTE | Affiliated to VTU</div>
  </div>
  <div class="body">
    <div class="cert-title">${cert.type}</div>
    <hr class="divider">
    <div class="content">${body}</div>
    <div class="footer-date">Date of Issue: ${issuedOn}</div>
    <div class="footer-sig">
      <div class="name">Principal / Registrar</div>
      <div class="sub">EduAdmin Institute</div>
    </div>
    <div class="cert-id">
      <span>Certificate ID: ${cert._id}</span>
      <span>Generated: ${issuedOn}</span>
    </div>
  </div>
</body>
</html>`;
}

// GET /api/certificates/pdf/:id
router.get('/pdf/:id', async (req, res) => {
  let browser;
  try {
    const cert = await Certificate.findById(req.params.id).populate('templateId');
    if (!cert) return res.status(404).json({ success: false, error: 'Certificate not found' });

    // ── Status gate: Approved and Generated certificates may be downloaded ──
    // Generated = previously downloaded (already approved); Approved = ready to download
    if (cert.status !== 'Approved' && cert.status !== 'Generated') {
      return res.status(403).json({
        success: false,
        error: cert.status === 'Rejected'
          ? 'This certificate has been rejected and cannot be downloaded.'
          : 'Certificate is pending approval. Download is available once approved.',
      });
    }

    // ── Always fetch the latest template and regenerate content ─────────────
    // This ensures template edits are reflected immediately in every download.
    const tmpl = (cert.templateId && cert.templateId._id)
      ? cert.templateId                                           // already populated
      : await CertificateTemplate.findOne({
          $or: [
            ...(cert.templateId ? [{ _id: cert.templateId }] : []),
            { name: cert.type },
          ],
        });

    if (tmpl) {
      // Re-fetch the template as a plain doc to ensure we have the latest notes
      const latestTmpl = await CertificateTemplate.findById(tmpl._id || tmpl);
      if (latestTmpl) {
        const studentDoc = await Student.findOne({
          $or: [{ student_id: cert.usn }, { email: cert.usn }],
          isDeleted: { $ne: true },
        });
        const vars = buildAutoVars(studentDoc, cert.studentName, cert.usn);
        // Merge persisted fieldValues but never let empty strings overwrite computed vars
        for (const [k, v] of Object.entries(cert.fieldValues || {})) {
          if (v !== '' && v !== null && v !== undefined) vars[k] = v;
        }
        cert.filledNotes = substituteVars(latestTmpl.notes || '', vars);
        console.log('[PDF] Using template:', latestTmpl.name, '| vars:', vars);
      }
    }

    cert.generatedDate = new Date();
    cert.status        = 'Generated';
    await cert.save();
    await Approval.findOneAndUpdate({ certificateRef: cert._id }, { status: 'Approved' });

    const issuedOn = cert.generatedDate.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    const html     = buildCertHtml(cert, issuedOn);
    const filename = `${cert.type.replace(/\s+/g, '_')}_${cert.usn}.pdf`;

    browser = await puppeteer.launch(await getLaunchOptions());
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    await browser.close();
    browser = null;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(pdfBuffer);
  } catch (err) {
    if (browser) { try { await browser.close(); } catch { /* ignore */ } }
    if (!res.headersSent) res.status(500).json({ success: false, error: err.message });
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

// POST /api/certificates/templates/upload-pdf
router.post('/templates/upload-pdf', pdfUpload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No PDF file received' });
  }

  let pageCount = 1;
  let html      = '';
  let warning   = null;
  let usedOcr   = false;

  // ── Step 1: try pdf-parse (text-based PDFs) ──────────────────────────────
  try {
    const parsed = await pdfParse(req.file.buffer);
    pageCount    = parsed.numpages || 1;
    const text   = (parsed.text || '').trim();

    if (text.length >= 20) {
      // Good text extraction
      html = textToHtml(text);
    }
  } catch {
    // pdf-parse threw — fall through to OCR
  }

  // ── Step 2: OCR fallback (scanned / image-only PDFs) ────────────────────
  if (!html) {
    usedOcr = true;
    let worker;
    try {
      worker = await createWorker('eng');
      // Pass the PDF buffer directly; Tesseract will attempt to recognise it.
      // Works best when the PDF wraps a single JPEG/PNG image.
      const { data: ocrData } = await worker.recognize(req.file.buffer);
      const ocrText = (ocrData.text || '').trim();

      if (ocrText.length >= 5) {
        // OCR produced something — convert to simple paragraphs
        html = `<div>${ocrText.replace(/\r?\n/g, '<br/>')}</div>`;
      } else {
        html = '<p>Content could not be extracted automatically. Please add your content manually.</p>';
      }
    } catch {
      html = '<p>OCR processing failed. Please add your content manually.</p>';
    } finally {
      if (worker) { try { await worker.terminate(); } catch { /* ignore */ } }
    }

    warning = '⚠ Layout may not be perfect — scanned PDF detected. OCR was used; please review and adjust manually.';
  }

  res.json({ success: true, html, pages: pageCount, usedOcr, warning });
});

module.exports = router;
