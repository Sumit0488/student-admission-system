/**
 * Shared certificate variable utilities.
 * Used by both certificate.routes.js and certificate-request.routes.js
 * to ensure PDFs generated from either path have identical variable maps.
 */

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

// Reverse lookup: full name → code (built once at startup)
const PROGRAM_CODE_MAP = Object.fromEntries(
  Object.entries(PROGRAM_NAMES).map(([code, name]) => [name.toLowerCase(), code])
);

function getFullProgramName(program) {
  if (!program) return '';
  if (PROGRAM_NAMES[program.toUpperCase()]) return PROGRAM_NAMES[program.toUpperCase()];
  return program;
}

function getProgramCode(program) {
  if (!program) return '';
  if (PROGRAM_NAMES[program.toUpperCase()]) return program.toUpperCase();
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

function formatDateInWords(dateString) {
  const date = new Date(dateString);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDateFullWords(dateString) {
  const date = new Date(dateString);
  const day = DAY_ORDINALS[date.getDate()] || String(date.getDate());
  const month = MONTHS[date.getMonth()];
  const year = numberToWords(date.getFullYear());
  return `${day} ${month} ${year}`;
}

/**
 * Build the full variable map for template substitution.
 *
 * @param {object|null} student  - Mongoose Student document (or null for fallback)
 * @param {string} fallbackName  - Used when student is null or has no fullName
 * @param {string} fallbackUsn   - Used when student is null or has no student_id
 * @param {object|string} tenantInfo - { place, name } or plain place string
 * @returns {object} Key→value map ready for substituteVars()
 */
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
    const y = today.getFullYear();
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

  // Dynamic semester — month-aware calculation (Indian academic year: Aug–Jul)
  const calcSem = () => {
    const batchYear = parseInt((student.batch || '').split('-')[0], 10);
    if (isNaN(batchYear)) return student.term ?? 1;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const academicStartYear = currentMonth >= 8 ? currentYear : currentYear - 1;
    const yearsElapsed = academicStartYear - batchYear;
    if (yearsElapsed < 0) return student.term ?? 1;
    const semesterOffset = currentMonth >= 2 && currentMonth <= 7 ? 1 : 0;
    const base = (student.admissionCategory || '').toLowerCase() === 'lateral' ? 3 : 1;
    return Math.min(Math.max(yearsElapsed * 2 + semesterOffset + base, base), 8);
  };

  const sem = calcSem();
  const semStr = String(sem);
  const semOrd = ORDINALS[sem] ? `${ORDINALS[sem]} Semester` : `${sem}th Semester`;
  const yearNum = Math.ceil(sem / 2);
  const yearOrd = YEAR_ORDINALS[yearNum] || `${yearNum}th`;
  const yearLabel = `${yearOrd} Year`;

  const studentName = student.fullName || fallbackName;
  const usnVal = student.student_id || fallbackUsn;
  const programCode = getProgramCode(student.program || '');
  const programFull = getFullProgramName(student.program || '');
  const academicYear =
    student.batch || `${today.getFullYear()}-${String(today.getFullYear() + 1).slice(-2)}`;

  return {
    // Identity
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
    college_name: COLLEGE_NAME,

    // Academic
    program: programCode,
    program_full_name: programFull,
    branch: programFull,
    department: programFull,
    program_code: programCode,
    degree: student.degree || '',
    batch: student.batch || academicYear,
    academic_year: `<span style="white-space:nowrap">${academicYear}</span>`,
    accademic_year: `<span style="white-space:nowrap">${academicYear}</span>`,

    // Term
    semester: semStr,
    sem: semStr,
    current_term: semOrd,
    year: yearLabel,
    year_number: String(yearNum),
    year_of_study: yearLabel,

    // Personal
    gender: student.gender || '',
    religion: student.religion || '',
    caste: student.caste || '',
    date_of_birth: student.dob ? formatDateInWords(student.dob) : '',
    dob: student.dob ? formatDateInWords(student.dob) : '',
    dob_in_words: student.dob ? formatDateFullWords(student.dob) : '',
    date_of_birth_in_words: student.dob ? formatDateFullWords(student.dob) : '',

    // Dates
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
}

/**
 * Replace all {{key}} placeholders in a template string.
 * Logs and strips any placeholders that remain unresolved.
 */
function substituteVars(template, vars) {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`\\{\\{${escaped}\\}\\}`, 'g'), String(v ?? ''));
  }
  const remaining = [...out.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)].map((m) => m[1]);
  if (remaining.length > 0) {
    console.warn('[Certificate] Unresolved placeholders — stripped:', [...new Set(remaining)]);
    out = out.replace(/\{\{[a-zA-Z0-9_]+\}\}/g, '');
  }
  return out;
}

module.exports = {
  PROGRAM_NAMES,
  ORDINALS,
  YEAR_ORDINALS,
  getFullProgramName,
  getProgramCode,
  buildAutoVars,
  substituteVars,
};
