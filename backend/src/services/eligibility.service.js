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
    test: (s) => s.feesCleared === true,
  },
  noDisciplinaryAction: {
    label: 'No active disciplinary action',
    test: (s) => !s.disciplinaryStatus || s.disciplinaryStatus !== 'Active',
  },

  // ── Attendance (≥ 75%) ─────────────────────────────────────────────────────
  attendance75: {
    label: 'Attendance must be at least 75%',
    test: (s) => s.attendance == null || s.attendance >= 75,
  },
  attendance50: {
    label: 'Attendance must be at least 50%',
    test: (s) => s.attendance == null || s.attendance >= 50,
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
  Bonafide: [
    RULES.activeStatus,
    RULES.notDebarred,
    RULES.feesCleared,
    RULES.attendance75,
  ],
  Study: [
    RULES.activeStatus,
    RULES.notDebarred,
    RULES.feesCleared,
    RULES.attendance75,
    RULES.hasAcademicRecord,
  ],
  Transfer: [
    RULES.notDebarred,
    RULES.feesCleared,
    RULES.noDisciplinaryAction,
  ],
  Conduct: [
    RULES.activeStatus,
    RULES.notDebarred,
    RULES.noDisciplinaryAction,
    RULES.attendance50,
  ],
  'Course Completion': [
    RULES.courseCompleted,
    RULES.feesCleared,
    RULES.hasAcademicRecord,
    RULES.noDisciplinaryAction,
  ],
};

// Aliases for flexible input: "TC" → "Transfer", etc.
const TYPE_ALIASES = {
  tc: 'Transfer',
  'transfer certificate': 'Transfer',
  bonafide: 'Bonafide',
  study: 'Study',
  conduct: 'Conduct',
  'course completion': 'Course Completion',
  completion: 'Course Completion',
};

const normaliseType = (raw = '') => {
  const lower = raw.trim().toLowerCase();
  return TYPE_ALIASES[lower] || raw.trim();
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
      failedChecks: [`Unknown certificate type: "${type}". Valid types: ${Object.keys(CERTIFICATE_RULES).join(', ')}`],
    };
  }

  const failedChecks = rules
    .filter((rule) => !rule.test(student))
    .map((rule) => rule.label);

  return {
    eligible: failedChecks.length === 0,
    certificateType: type,
    failedChecks,
  };
};

module.exports = { checkEligibility, CERTIFICATE_RULES, normaliseType };
