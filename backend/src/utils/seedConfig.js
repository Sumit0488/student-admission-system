const Config = require('../models/config.model');

const SEED = [
  // ── Programs ────────────────────────────────────────────────────────────────
  { type: 'program', value: 'B.E CSE',                   order: 1 },
  { type: 'program', value: 'B.E ECE',                   order: 2 },
  { type: 'program', value: 'B.E Civil',                 order: 3 },
  { type: 'program', value: 'B.E Mechanical',            order: 4 },
  { type: 'program', value: 'B.E AI & ML',               order: 5 },
  { type: 'program', value: 'B.E Data Science',          order: 6 },
  { type: 'program', value: 'B.E Information Science',   order: 7 },
  { type: 'program', value: 'B.E EEE',                   order: 8 },
  { type: 'program', value: 'CSE Design',                order: 9 },
  { type: 'program', value: 'CSE Business System',       order: 10 },

  // ── Batches ──────────────────────────────────────────────────────────────────
  { type: 'batch', value: '2020–2024', order: 1 },
  { type: 'batch', value: '2021–2025', order: 2 },
  { type: 'batch', value: '2022–2026', order: 3 },
  { type: 'batch', value: '2023–2027', order: 4 },
  { type: 'batch', value: '2024–2028', order: 5 },
  { type: 'batch', value: '2025–2029', order: 6 },
  { type: 'batch', value: '2026–2030', order: 7 },

  // ── Statuses ──────────────────────────────────────────────────────────────────
  { type: 'status', value: 'Live',      order: 1 },
  { type: 'status', value: 'Completed', order: 2 },
  { type: 'status', value: 'Cancelled', order: 3 },
  { type: 'status', value: 'Detained',  order: 4 },
];

const seedConfig = async () => {
  // Always wipe and re-seed so stale/wrong entries never persist
  await Config.deleteMany({});
  await Config.insertMany(SEED);
  console.log(`✅ Config seeded: ${SEED.length} items (programs, batches, statuses)`);
};

module.exports = seedConfig;
