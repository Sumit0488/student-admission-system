/**
 * One-time migration script
 * ─────────────────────────
 * Fixes existing student documents in MongoDB:
 *   1. Capitalizes fullName  ("vinay k b" → "Vinay K B")
 *   2. Normalizes old program names to current seed values
 *
 * Run once:
 *   node backend/src/utils/migrateStudents.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Student  = require('../models/student.model');

// ─── Map old program names → current seed values ──────────────────────────────
const PROGRAM_MAP = {
  'B.E Computer Science&Design':          'CSE Design',
  'B.E Computer Science & Design':        'CSE Design',
  'B.E CSE Design':                       'CSE Design',
  'B.E Computer Science&Business Studies':'CSE Business System',
  'B.Design Business Studies':            'CSE Business System',
  'B.E Business Studies':                 'CSE Business System',
  'B.E Comp Sci':                         'B.E CSE',
  'B.E Computer Science':                 'B.E CSE',
  // Add more mappings here if needed
};

const toTitleCase = (str) => str.replace(/\b\w/g, (c) => c.toUpperCase());

async function migrate() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/studentAdmission';
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('✅ Connected\n');

  const students = await Student.find({ isDeleted: false });
  console.log(`📋 Found ${students.length} students to check\n`);

  let nameFixed    = 0;
  let programFixed = 0;

  for (const s of students) {
    const updates = {};

    // 1. Fix name capitalization
    const proper = toTitleCase(s.fullName || '');
    if (proper !== s.fullName) {
      updates.fullName = proper;
      console.log(`  NAME   : "${s.fullName}" → "${proper}"`);
      nameFixed++;
    }

    // 2. Fix program name
    if (s.program && PROGRAM_MAP[s.program]) {
      updates.program = PROGRAM_MAP[s.program];
      console.log(`  PROGRAM: "${s.program}" → "${updates.program}"  (${s.fullName})`);
      programFixed++;
    }

    if (Object.keys(updates).length > 0) {
      await Student.updateOne({ _id: s._id }, { $set: updates });
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Migration complete`);
  console.log(`   Names fixed   : ${nameFixed}`);
  console.log(`   Programs fixed: ${programFixed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
