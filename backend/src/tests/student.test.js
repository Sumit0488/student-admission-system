/**
 * Sample unit tests for student service helpers.
 * Run with:  npm test   (in /backend)
 * Uses Node's built-in test runner (Node >= 18) — no extra deps needed.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// ── Inline the pure helpers so tests don't need a live DB ────────────────────

function calculateTerm(batch, admissionCategory) {
  if (!batch) return null;
  const batchYear = parseInt((batch || '').split('-')[0], 10);
  if (isNaN(batchYear)) return null;
  const currentYear = new Date().getFullYear();
  const base = (admissionCategory || '').toLowerCase() === 'lateral' ? 3 : 1;
  const term = (currentYear - batchYear) * 2 + base;
  return Math.min(Math.max(term, base), 8);
}

function getProgramCode(program, PROGRAM_NAMES, CODE_MAP) {
  if (!program) return '';
  if (PROGRAM_NAMES[program.toUpperCase()]) return program.toUpperCase();
  return CODE_MAP[program.toLowerCase()] || program;
}

const PROGRAM_NAMES = {
  CSE:   'Computer Science and Engineering',
  ECE:   'Electronics and Communication Engineering',
  CIVIL: 'Civil Engineering',
};
const CODE_MAP = Object.fromEntries(
  Object.entries(PROGRAM_NAMES).map(([c, n]) => [n.toLowerCase(), c])
);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('calculateTerm', () => {
  const currentYear = new Date().getFullYear();

  it('returns null when batch is empty', () => {
    assert.equal(calculateTerm('', 'Regular'), null);
    assert.equal(calculateTerm(null, 'Regular'), null);
  });

  it('regular student — batch this year → term 1', () => {
    const batch = `${currentYear}-${String(currentYear + 1).slice(-2)}`;
    assert.equal(calculateTerm(batch, 'Regular'), 1);
  });

  it('lateral student — batch this year → term 3', () => {
    const batch = `${currentYear}-${String(currentYear + 1).slice(-2)}`;
    assert.equal(calculateTerm(batch, 'Lateral'), 3);
  });

  it('regular student — 2 years ago → term 5', () => {
    const y = currentYear - 2;
    assert.equal(calculateTerm(`${y}-${String(y + 1).slice(-2)}`, 'Regular'), 5);
  });

  it('caps at 8 for very old batches', () => {
    assert.equal(calculateTerm('2015-16', 'Regular'), 8);
  });
});

describe('getProgramCode', () => {
  it('returns code for a full program name', () => {
    assert.equal(getProgramCode('Computer Science and Engineering', PROGRAM_NAMES, CODE_MAP), 'CSE');
  });

  it('returns code when already a code (case-insensitive)', () => {
    assert.equal(getProgramCode('cse', PROGRAM_NAMES, CODE_MAP), 'CSE');
  });

  it('returns original string when no mapping found', () => {
    assert.equal(getProgramCode('Unknown Program', PROGRAM_NAMES, CODE_MAP), 'Unknown Program');
  });

  it('returns empty string for falsy input', () => {
    assert.equal(getProgramCode('', PROGRAM_NAMES, CODE_MAP), '');
  });
});
