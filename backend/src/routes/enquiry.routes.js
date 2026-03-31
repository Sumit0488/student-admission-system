const express = require('express');
const router = express.Router();
const Enquiry = require('../models/enquiry.model');
const Schedule = require('../models/schedule.model');
const Student = require('../models/student.model');

// Extract degree from schedule name — mirrors schedule.routes.js logic
function extractDegreeFromSchedule(schedule) {
  if (!schedule) return '';
  if (schedule.degree) return schedule.degree; // already stored
  const name = schedule.scheduleName || '';
  return name.trim().split(/\s+/)[0] || ''; // fallback: first word
}

// ── Required documents per admission category ────────────────────────────────
const STD_DOCS = {
  Regular: [
    '10th Certificate',
    'PUC/12th Marks Card',
    'Transfer Certificate',
    'Aadhar Card',
    'Passport Photo',
  ],
  Lateral: [
    '10th Certificate',
    'Diploma Certificate',
    'Transfer Certificate',
    'Aadhar Card',
    'Passport Photo',
  ],
};

// ── Default term per admission category (matches ADMISSION_TYPE_MAP in schedule.routes.js)
const DEFAULT_TERM = { Regular: 1, Lateral: 3 };
const DEFAULT_YEAR = { Regular: 1, Lateral: 2 };

// ── Term validation helper ────────────────────────────────────────────────────
// Only validates the term number is correct — does NOT check enabled flag.
// Both Regular and Lateral are always valid; the schedule config controls terms.
function validateTerm(category, term, schedule) {
  if (!category || term === null || term === undefined) return null;
  const key = category.toLowerCase();
  const config = schedule?.admissionType?.[key];
  // Only reject if allowedTerms are explicitly set AND the term is not in the list
  if (config?.allowedTerms?.length && !config.allowedTerms.includes(Number(term))) {
    return `Term ${term} is not valid for ${category} admission. Allowed: ${config.allowedTerms.join(', ')}`;
  }
  return null;
}

// ── Derive term from admissionCategory when not supplied ─────────────────────
function resolveTermForCategory(category, schedule) {
  if (!category) return null;
  const key = category.toLowerCase();
  const config = schedule?.admissionType?.[key];
  // Use schedule's allowedTerms[0] when configured, else fall back to defaults
  if (config?.allowedTerms?.length) return config.allowedTerms[0];
  return DEFAULT_TERM[category] ?? null;
}

function resolveYearForCategory(category) {
  return DEFAULT_YEAR[category] ?? null;
}

// ── GET /api/enquiry ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const {
      q = '',
      status = '',
      stream = '',
      interestLevel = '',
      scheduleId = '',
      admissionStage = '',
    } = req.query;
    const filter = {};

    if (q.trim()) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { stream: { $regex: q, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;
    if (stream) filter.stream = { $regex: stream, $options: 'i' };
    if (interestLevel) filter.interestLevel = interestLevel;
    if (scheduleId) filter.scheduleId = scheduleId;
    if (admissionStage) filter.admissionStage = admissionStage;

    const data = await Enquiry.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/enquiry/create ──────────────────────────────────────────────────
router.post('/create', async (req, res) => {
  try {
    const { name, phone, email, stream, scheduleId } = req.body;

    // Required field validation
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'Name is required' });
    if (!email?.trim()) return res.status(400).json({ success: false, error: 'Email is required' });
    if (!stream?.trim() && !scheduleId) {
      return res.status(400).json({ success: false, error: 'Stream is required' });
    }
    if (!phone) return res.status(400).json({ success: false, error: 'Phone is required' });

    const digits = String(phone).replace(/^\+91/, '').trim();
    if (!/^\d{10}$/.test(digits)) {
      return res.status(400).json({ success: false, error: 'Phone must be exactly 10 digits' });
    }

    // Build payload from all recognised fields — no enum restrictions
    const b = req.body;
    const payload = {
      name: name.trim(),
      phone: `+91${digits}`,
      email: email.trim(),
      stream: stream?.trim() || '',
      // programme & admission
      program: b.program || '',
      admissionCategory: b.admissionCategory || '',
      term: b.term !== null && b.term !== undefined ? Number(b.term) : null,
      admissionDate: b.admissionDate || null,
      admissionMode: b.admissionMode || '',
      quota: b.quota || '',
      seatNumber: b.seatNumber || '',
      seatCategory: b.seatCategory || '',
      kannada: b.kannada || '',
      batch: b.batch || '',
      // personal
      gender: b.gender || '',
      dob: b.dob || null,
      aadhaar: b.aadhaar || '',
      pan: b.pan || '',
      bloodGroup: b.bloodGroup || '',
      area: b.area || '',
      motherTongue: b.motherTongue || '',
      religion: b.religion || '',
      caste: b.caste || '',
      subCaste: b.subCaste || '',
      // entrance exam
      examName: b.examName || '',
      examRank: b.examRank ? Number(b.examRank) : null,
      hallTicketNo: b.hallTicketNo || '',
      examYear: b.examYear ? Number(b.examYear) : null,
      admOrderDate: b.admOrderDate || null,
      issuedDate: b.issuedDate || null,
      allotmentDate: b.allotmentDate || null,
      lastJoiningDate: b.lastJoiningDate || null,
      claimedSeatCat: b.claimedSeatCat || '',
      allotedSeatCat: b.allotedSeatCat || '',
      admOrderNumber: b.admOrderNumber || '',
      feePaid: b.feePaid ? Number(b.feePaid) : null,
      regNo: b.regNo || null,
      prevQualification: b.prevQualification || '',
      // previous education
      prevBoard: b.prevBoard || '',
      prevCollege: b.prevCollege || '',
      prevPercentage: b.prevPercentage ? Number(b.prevPercentage) : null,
      prevYearPassing: b.prevYearPassing ? Number(b.prevYearPassing) : null,
      // parents
      fatherName: b.fatherName || '',
      fatherContact: b.fatherContact || '',
      fatherOccupation: b.fatherOccupation || '',
      fatherIncome: b.fatherIncome ? Number(b.fatherIncome) : null,
      fatherEmail: b.fatherEmail || '',
      fatherPan: b.fatherPan || '',
      motherName: b.motherName || '',
      motherContact: b.motherContact || '',
      motherOccupation: b.motherOccupation || '',
      motherIncome: b.motherIncome ? Number(b.motherIncome) : null,
      motherEmail: b.motherEmail || '',
      motherPan: b.motherPan || '',
      // address
      addressLine: b.addressLine || '',
      city: b.city || '',
      state: b.state || '',
      pincode: b.pincode || '',
      // misc
      interestLevel: b.interestLevel || '',
      notes: b.notes || '',
      documents: b.documents || [],
    };

    // Schedule-linked logic
    if (scheduleId) {
      const schedule = await Schedule.findById(scheduleId);
      if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });

      // Auto-assign term + year from admissionCategory when not supplied by client
      if (payload.admissionCategory) {
        if (payload.term === null || payload.term === undefined) {
          payload.term = resolveTermForCategory(payload.admissionCategory, schedule);
        }
        if (payload.year_of_study === null || payload.year_of_study === undefined) {
          payload.year_of_study = resolveYearForCategory(payload.admissionCategory);
        }
      }

      // Term validation (only checks allowedTerms list, not enabled flag)
      if (payload.admissionCategory && payload.term !== null && payload.term !== undefined) {
        const termErr = validateTerm(payload.admissionCategory, payload.term, schedule);
        if (termErr) return res.status(400).json({ success: false, error: termErr });
      }

      // Auto-fill from schedule
      payload.scheduleId = scheduleId;
      payload.stream = schedule.scheduleName || schedule.stream;
      payload.academicYear = schedule.academicYear;

      // Atomically generate applicantId
      const updated = await Schedule.findByIdAndUpdate(
        scheduleId,
        { $inc: { applicantCount: 1 } },
        { new: true }
      );
      payload.applicantId = `${updated.applicantPrefix}-${String(updated.applicantCount).padStart(4, '0')}`;
    }

    // Initialise documents from STD_DOCS when category is set and none provided
    if (
      payload.admissionCategory &&
      STD_DOCS[payload.admissionCategory] &&
      !payload.documents.length
    ) {
      payload.documents = STD_DOCS[payload.admissionCategory].map((n) => ({
        name: n,
        submitted: false,
      }));
    }

    const enquiry = await Enquiry.create(payload);
    res.status(201).json({ success: true, data: enquiry });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/enquiry/:id/followup ────────────────────────────────────────────
router.post('/:id/followup', async (req, res) => {
  try {
    const { date, note = '', status = '' } = req.body;
    if (!date) return res.status(400).json({ success: false, error: 'Date is required' });

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { $push: { followUps: { date: new Date(date), note, status } } },
      { new: true }
    );
    if (!enquiry) return res.status(404).json({ success: false, error: 'Enquiry not found' });
    res.json({ success: true, data: enquiry });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/enquiry/convert/:id ─────────────────────────────────────────────
router.post('/convert/:id', async (req, res) => {
  try {
    const { force = false, degree: degreeOverride } = req.body; // allow bypassing doc check; degree override from UI

    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ success: false, error: 'Enquiry not found' });
    if (enquiry.status === 'Converted') {
      return res.status(400).json({ success: false, error: 'Enquiry is already converted' });
    }

    let schedule = null;
    let regNo = null;

    if (enquiry.scheduleId) {
      schedule = await Schedule.findById(enquiry.scheduleId);
      if (!schedule)
        return res.status(404).json({ success: false, error: 'Linked schedule not found' });

      // Auto-assign term if enquiry has category but no term set
      if (enquiry.admissionCategory && (enquiry.term === null || enquiry.term === undefined)) {
        const autoTerm = resolveTermForCategory(enquiry.admissionCategory, schedule);
        if (autoTerm !== null && autoTerm !== undefined)
          await Enquiry.findByIdAndUpdate(enquiry._id, { term: autoTerm });
        enquiry.term = autoTerm;
      }

      // Term validation (only checks allowedTerms list, not enabled flag)
      if (enquiry.admissionCategory && enquiry.term !== null && enquiry.term !== undefined) {
        const termErr = validateTerm(enquiry.admissionCategory, enquiry.term, schedule);
        if (termErr) return res.status(400).json({ success: false, error: termErr });
      }

      // Document check (skip if force = true)
      if (!force && enquiry.documents.length > 0) {
        const missing = enquiry.documents.filter((d) => !d.submitted).map((d) => d.name);
        if (missing.length > 0) {
          return res.status(400).json({
            success: false,
            error: `Missing documents: ${missing.join(', ')}`,
            missingDocs: missing,
          });
        }
      }

      // Seat check — skip when maxSeats is 0 (unlimited)
      let updated;
      if (!schedule.maxSeats || schedule.maxSeats <= 0) {
        // Unlimited seats — just increment counter
        updated = await Schedule.findByIdAndUpdate(
          enquiry.scheduleId,
          { $inc: { filledSeats: 1 } },
          { new: true }
        );
      } else {
        // Bounded seats — atomic check + increment
        updated = await Schedule.findOneAndUpdate(
          { _id: enquiry.scheduleId, $expr: { $lt: ['$filledSeats', '$maxSeats'] } },
          { $inc: { filledSeats: 1 } },
          { new: true }
        );
        if (!updated) {
          return res
            .status(400)
            .json({ success: false, error: 'All seats are filled for this schedule' });
        }
      }
      regNo = `${updated.regPrefix}-${String(updated.filledSeats).padStart(4, '0')}`;
    }

    // Build address string from enquiry fields
    const addressParts = [enquiry.addressLine, enquiry.city, enquiry.state, enquiry.pincode].filter(
      Boolean
    );

    // Auto-generate college email from name so the student's Gmail stays as personalEmail
    const nameSlug = enquiry.name
      .toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/[^a-z.]/g, '');
    const autoEmail = `${nameSlug}.${Date.now()}@student.edu`;

    // Create student record with full details
    const student = await Student.create({
      fullName: enquiry.name,
      email: autoEmail, // college email — auto-generated
      personalEmail: enquiry.email || '', // student's Gmail / personal email
      phone: enquiry.phone,
      program: enquiry.program || enquiry.stream,
      degree: degreeOverride?.trim() || extractDegreeFromSchedule(schedule) || null,
      batch: enquiry.batch || enquiry.academicYear || '',
      term: enquiry.term ?? null,
      admissionCategory: enquiry.admissionCategory || '',
      admissionStatus: 'Live',
      address: addressParts.join(', ') || '',
      // Personal details from enquiry — used in certificate generation
      gender: enquiry.gender || '',
      dob: enquiry.dob || null,
      religion: enquiry.religion || '',
      caste: enquiry.caste || '',
      fatherName: enquiry.fatherName || '',
      admissionDate: enquiry.admissionDate || null,
      lastJoiningDate: enquiry.lastJoiningDate || null,
    });

    // Update enquiry
    enquiry.status = 'Converted';
    enquiry.admissionStage = 'Admitted';
    enquiry.convertedStudentId = student.student_id;
    if (regNo) enquiry.regNo = regNo;
    await enquiry.save();

    res.status(201).json({ success: true, data: { enquiry, student } });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ success: false, error: 'A student with this email already exists' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/enquiry/:id ──────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const ALLOWED = [
      // core
      'status',
      'admissionStage',
      'interestLevel',
      'notes',
      'name',
      'phone',
      'email',
      'stream',
      'academicYear',
      'batch',
      // programme & admission
      'program',
      'admissionCategory',
      'term',
      'admissionDate',
      'admissionMode',
      'quota',
      'seatNumber',
      'seatCategory',
      'kannada',
      // personal
      'gender',
      'dob',
      'aadhaar',
      'pan',
      'bloodGroup',
      'area',
      'motherTongue',
      'religion',
      'caste',
      'subCaste',
      // entrance exam
      'examName',
      'examRank',
      'hallTicketNo',
      'examYear',
      'admOrderDate',
      'issuedDate',
      'allotmentDate',
      'lastJoiningDate',
      'claimedSeatCat',
      'allotedSeatCat',
      'admOrderNumber',
      'feePaid',
      'regNo',
      'prevQualification',
      // previous education
      'prevBoard',
      'prevCollege',
      'prevPercentage',
      'prevYearPassing',
      // parents
      'fatherName',
      'fatherContact',
      'fatherOccupation',
      'fatherIncome',
      'fatherEmail',
      'fatherPan',
      'motherName',
      'motherContact',
      'motherOccupation',
      'motherIncome',
      'motherEmail',
      'motherPan',
      // address
      'addressLine',
      'city',
      'state',
      'pincode',
      // documents
      'documents',
    ];
    const update = {};
    ALLOWED.forEach((f) => {
      if (req.body[f] !== undefined) update[f] = req.body[f];
    });

    // Auto-assign term from admissionCategory when not explicitly provided
    if (update.admissionCategory && (update.term === null || update.term === undefined)) {
      const enqForTerm = await Enquiry.findById(req.params.id).select('scheduleId term');
      if (enqForTerm?.scheduleId) {
        const schedForTerm = await Schedule.findById(enqForTerm.scheduleId);
        if (schedForTerm) {
          update.term = resolveTermForCategory(update.admissionCategory, schedForTerm);
          update.year_of_study = resolveYearForCategory(update.admissionCategory);
        }
      }
      if (update.term === null || update.term === undefined)
        update.term = DEFAULT_TERM[update.admissionCategory] ?? null;
    }

    // Term validation if schedule linked (only checks allowedTerms, not enabled flag)
    if (update.admissionCategory && update.term !== null && update.term !== undefined) {
      const enquiry = await Enquiry.findById(req.params.id).select('scheduleId');
      if (enquiry?.scheduleId) {
        const schedule = await Schedule.findById(enquiry.scheduleId);
        if (schedule) {
          const termErr = validateTerm(update.admissionCategory, update.term, schedule);
          if (termErr) return res.status(400).json({ success: false, error: termErr });
        }
      }
    }

    // When admissionCategory changes, init documents if currently empty
    if (update.admissionCategory && STD_DOCS[update.admissionCategory]) {
      const existing = await Enquiry.findById(req.params.id).select('documents admissionCategory');
      if (
        existing &&
        existing.admissionCategory !== update.admissionCategory &&
        existing.documents.length === 0
      ) {
        update.documents = STD_DOCS[update.admissionCategory].map((name) => ({
          name,
          submitted: false,
        }));
      }
    }

    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!enquiry) return res.status(404).json({ success: false, error: 'Enquiry not found' });
    res.json({ success: true, data: enquiry });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/enquiry/:id ───────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await Enquiry.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
