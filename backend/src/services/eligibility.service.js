/**
 * Certificate Eligibility Validation Service
 *
 * Each certificate type has its own set of rules.
 * checkEligibility(student, certificateType) → { eligible, failedChecks }
 *
 * Certificate types supported:
 *   Bonafide | Study | Transfer | Conduct | Course Completion
 */

// ─── Rule definitions ─────────────────────────────────────────────────────────
// Each rule: { field, label, test(student) → true means PASS }

const RULES = {
  // ── Common to all types ───────────────────────────────────────────────────
  activeStatus: {
    label: 'Admission status must be Live or Completed',
    test: (s) => ['Live', 'Completed'].includes(s.admissionStatus),
  },
  notDebarred: {
    label: 'Student must not be debarred',
    test: (s) => !s.isDebarred,
  },
  feesCleared: {
    label: 'All fees must be cleared',
    test: (s) => s.feesCleared !== false,
  },
  noDisciplinaryAction: {
    label: 'No active disciplinary action',
    test: (s) => !s.disciplinaryStatus || s.disciplinaryStatus !== 'Active',
  },

  // ── Attendance (≥ 75%) ─────────────────────────────────────────────────────
  attendance75: {
    label: 'Attendance must be at least 75%',
    test: (s) => s.attendance === null || s.attendance === undefined || s.attendance >= 75,
  },
  attendance50: {
    label: 'Attendance must be at least 50%',
    test: (s) => s.attendance === null || s.attendance === undefined || s.attendance >= 50,
  },

  // ── Academic record ────────────────────────────────────────────────────────
  hasAcademicRecord: {
    label: 'Academic record must be present',
    test: (s) => s.hasAcademicRecord !== false,
  },

  // ── Course completion ──────────────────────────────────────────────────────
  courseCompleted: {
    label: 'Admission status must be Completed for Course Completion certificate',
    test: (s) => s.admissionStatus === 'Completed',
  },
};

// ─── Certificate type → applicable rules ──────────────────────────────────────
const CERTIFICATE_RULES = {
  Bonafide: [RULES.activeStatus, RULES.notDebarred, RULES.feesCleared, RULES.attendance75],
  Study: [
    RULES.activeStatus,
    RULES.notDebarred,
    RULES.feesCleared,
    RULES.attendance75,
    RULES.hasAcademicRecord,
  ],
  Transfer: [RULES.notDebarred, RULES.feesCleared, RULES.noDisciplinaryAction],
  Conduct: [RULES.activeStatus, RULES.notDebarred, RULES.noDisciplinaryAction, RULES.attendance50],
  'Course Completion': [
    RULES.courseCompleted,
    RULES.feesCleared,
    RULES.hasAcademicRecord,
    RULES.noDisciplinaryAction,
  ],
};

// Aliases for flexible input: "TC" → "Transfer", "study certificate" → "Study", etc.
const TYPE_ALIASES = {
  // Exact canonical values (pass-through for already-correct input)
  bonafide: 'Bonafide',
  study: 'Study',
  transfer: 'Transfer',
  conduct: 'Conduct',
  'course completion': 'Course Completion',
  // "X certificate" variants — template names stored in DB may include the word "certificate"
  'bonafide certificate': 'Bonafide',
  'study certificate': 'Study',
  'transfer certificate': 'Transfer',
  'conduct certificate': 'Conduct',
  'course completion certificate': 'Course Completion',
  // Common misspellings of "Bonafide"
  bonified: 'Bonafide',
  'bonified certificate': 'Bonafide',
  bonafied: 'Bonafide',
  'bonafied certificate': 'Bonafide',
  'bona fide': 'Bonafide',
  'bona fide certificate': 'Bonafide',
  'bonafide cert': 'Bonafide',
  // Short aliases
  tc: 'Transfer',
  completion: 'Course Completion',
  // APPLICATION OF TRANSFER CERTIFICATE (full template name used by old records)
  'application of transfer certificate': 'Transfer',
};

const normaliseType = (raw = '') => {
  const lower = raw.trim().toLowerCase();
  // Direct alias lookup
  if (TYPE_ALIASES[lower]) return TYPE_ALIASES[lower];
  // Strip trailing " certificate" and try again (handles any unregistered "X certificate" names)
  const stripped = lower.replace(/\s+certificate$/, '').trim();
  if (TYPE_ALIASES[stripped]) return TYPE_ALIASES[stripped];
  // Return original trimmed value — rules lookup will handle the unknown-type error
  return raw.trim();
};

// ─── Core function ────────────────────────────────────────────────────────────
/**
 * @param {object} student  - Mongoose document or plain object with student fields
 * @param {string} certificateType  - e.g. "Bonafide", "Transfer", "TC"
 * @returns {{ eligible: boolean, certificateType: string, failedChecks: string[] }}
 */
const checkEligibility = (student, certificateType) => {
  const type = normaliseType(certificateType);
  const rules = CERTIFICATE_RULES[type];

  if (!rules) {
    return {
      eligible: false,
      certificateType: type,
      failedChecks: [
        `Unknown certificate type: "${type}". Valid types: ${Object.keys(CERTIFICATE_RULES).join(', ')}`,
      ],
    };
  }

  const failedChecks = rules.filter((rule) => !rule.test(student)).map((rule) => rule.label);

  return {
    eligible: failedChecks.length === 0,
    certificateType: type,
    failedChecks,
  };
};

module.exports = { checkEligibility, CERTIFICATE_RULES, normaliseType };
