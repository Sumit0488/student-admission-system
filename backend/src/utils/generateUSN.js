const Counter = require('../models/counter.model');

// Maps program name keywords → short branch code used in USN
const BRANCH_MAP = {
  'CSE Business System': 'CBS',
  'CSE Design':          'CSD',
  'AI & ML':             'AIML',
  'Data Science':        'DS',
  'Information Science': 'ISE',
  'Mechanical':          'ME',
  'Civil':               'CVL',
  'EEE':                 'EEE',
  'ECE':                 'ECE',
  'CSE':                 'CSE',
};

const extractBranchCode = (program = '') => {
  for (const [key, code] of Object.entries(BRANCH_MAP)) {
    if (program.includes(key)) return code;
  }
  const match = program.match(/(?:B\.E|B\.Design|CSE)\s+(\w+)/);
  return match ? match[1].substring(0, 4).toUpperCase() : 'GEN';
};

/**
 * Generates a USN atomically using a MongoDB counter document.
 * Format: STU-<YEAR>-<BRANCH>-<SEQ>   e.g. STU-2024-CSE-001
 *
 * Uses findOneAndUpdate with $inc — guaranteed unique even under concurrent requests.
 */
const generateUSN = async (program = '', batch = '') => {
  const year   = batch ? batch.split(/[–-]/)[0].trim() : String(new Date().getFullYear());
  const branch = extractBranchCode(program);
  const prefix = `STU-${year}-${branch}`;

  // Atomic increment — safe under concurrent requests
  const counter = await Counter.findOneAndUpdate(
    { _id: prefix },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );

  return `${prefix}-${String(counter.seq).padStart(3, '0')}`;
};

module.exports = generateUSN;
