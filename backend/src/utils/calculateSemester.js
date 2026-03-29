/**
 * Calculates the current semester for a student based on their batch.
 *
 * Academic calendar assumption:
 *   Odd  semesters (1,3,5,7) → July–December
 *   Even semesters (2,4,6,8) → January–June
 *
 * Formula:
 *   yearsPassed = currentYear - startYear
 *   base        = yearsPassed × 2          (completed semesters)
 *   semester    = base + (month >= 7 ? 1 : 2)
 *   Clamped between 1 and 8.
 *
 * Examples (current date = March 2026):
 *   "2022–2026"  → yearsPassed=4, base=8, month=3 → sem 10 → capped at 8
 *   "2023–2027"  → yearsPassed=3, base=6, month=3 → sem 8
 *   "2024–2028"  → yearsPassed=2, base=4, month=3 → sem 6
 *   "2025–2029"  → yearsPassed=1, base=2, month=3 → sem 4
 *   "2026–2030"  → yearsPassed=0, base=0, month=3 → sem 2
 *
 * Examples (current date = September 2026):
 *   "2026–2030"  → yearsPassed=0, base=0, month=9 → sem 1
 *   "2025–2029"  → yearsPassed=1, base=2, month=9 → sem 3
 */
const calculateSemester = (batch = '') => {
  const startYear = parseInt(batch.split(/[-–]/)[0]);
  if (!startYear || isNaN(startYear)) return 1;

  const now         = new Date();
  const currentYear = now.getFullYear();
  const month       = now.getMonth() + 1; // 1–12

  if (currentYear < startYear) return 1; // batch hasn't started yet

  const yearsPassed = currentYear - startYear;
  const base        = yearsPassed * 2;

  // July–Dec → odd semester (new academic year started)
  // Jan–Jun  → even semester (second half of academic year)
  const semester = base + (month >= 7 ? 1 : 2);

  return Math.min(Math.max(semester, 1), 8);
};

module.exports = calculateSemester;
