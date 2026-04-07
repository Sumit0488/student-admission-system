'use strict';

/**
 * migrate-tenant.js
 *
 * Stamps tenantId onto every document that is missing it OR has it set to null.
 * Safe to run multiple times — never overwrites a non-null tenantId.
 *
 * Usage (from backend/):
 *   npm run migrate:tenant
 *
 * Windows PowerShell override:
 *   $env:TENANT_NAME="MY INSTITUTION"; npm run migrate:tenant
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

// ── Stop-word acronym generator ───────────────────────────────────────────────
const STOP = new Set(['of', 'and', 'the', 'for', 'a', 'an', 'in', 'at', 'to', 'by']);
function toCode(name) {
  return name.trim().toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STOP.has(w))
    .map((w) => w[0])
    .join('');
}

// ── Minimal models (strict:false so no validator side-effects) ────────────────
const tenantRef = { type: Types.ObjectId, ref: 'Tenant', default: null };

const Tenant = mongoose.model('Tenant', new Schema({
  name:     { type: String, required: true },
  code:     { type: String },
  slug:     { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true }));

const MODELS = {
  Student:            mongoose.model('Student',            new Schema({ tenantId: tenantRef }, { strict: false, timestamps: true })),
  Approval:           mongoose.model('Approval',           new Schema({ tenantId: tenantRef }, { strict: false, timestamps: true })),
  Certificate:        mongoose.model('Certificate',        new Schema({ tenantId: tenantRef }, { strict: false, timestamps: true })),
  CertificateRequest: mongoose.model('CertificateRequest', new Schema({ tenantId: tenantRef }, { strict: false, timestamps: true })),
  EligibilityHistory: mongoose.model('EligibilityHistory', new Schema({ tenantId: tenantRef }, { strict: false, timestamps: true })),
  Enquiry:            mongoose.model('Enquiry',            new Schema({ tenantId: tenantRef }, { strict: false, timestamps: true })),
  Schedule:           mongoose.model('Schedule',           new Schema({ tenantId: tenantRef }, { strict: false, timestamps: true })),
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const pad  = (s, n = 22) => String(s).padEnd(n);
const line = ()           => console.log('─'.repeat(62));

// Matches documents where tenantId is absent OR explicitly null
const MISSING_FILTER = { $or: [{ tenantId: { $exists: false } }, { tenantId: null }] };

async function stampCollection(Model, tenantId) {
  const pending = await Model.countDocuments(MISSING_FILTER);

  if (pending === 0) {
    console.log(`  ${pad(Model.modelName)} ✓  already fully stamped`);
    return 0;
  }

  const { modifiedCount } = await Model.updateMany(
    MISSING_FILTER,
    { $set: { tenantId } },
  );

  console.log(`  ${pad(Model.modelName)} ✓  ${modifiedCount} / ${pending} documents stamped`);
  return modifiedCount;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error('❌  MONGO_URI not set in .env'); process.exit(1); }

  console.log('\n🔌  Connecting to MongoDB…');
  await mongoose.connect(uri, { family: 4 });
  console.log(`✅  Connected: ${mongoose.connection.host}\n`);

  const TENANT_NAME = process.env.TENANT_NAME || 'BAPUJI INSTITUTE OF ENGINEERING AND TECHNOLOGY';
  const code        = toCode(TENANT_NAME);   // "biet"

  line();
  console.log(`🏫  Tenant : "${TENANT_NAME}"`);
  console.log(`🔑  Code   : "${code}"\n`);

  // Find by name → code → create
  let tenant = await Tenant.findOne({ name: TENANT_NAME })
            || await Tenant.findOne({ code })
            || await Tenant.findOne({ slug: code });

  if (!tenant) {
    tenant = await Tenant.create({ name: TENANT_NAME, code, slug: code });
    console.log(`  ℹ️  Tenant created  _id: ${tenant._id}`);
  } else {
    // Patch code/slug if the tenant was created with the old slug format
    const needsPatch = tenant.code !== code || tenant.slug !== code;
    if (needsPatch) {
      await Tenant.updateOne({ _id: tenant._id }, { $set: { code, slug: code } });
      tenant.code = code;
      console.log(`  🔧  Tenant code patched → "${code}"`);
    }
    console.log(`  ✅  Tenant found   _id: ${tenant._id}  code: "${tenant.code}"`);
  }

  const tenantId = tenant._id;
  line();

  // ── Stamp ─────────────────────────────────────────────────────────────────
  console.log('📦  Stamping collections…\n');
  let total = 0;
  for (const Model of Object.values(MODELS)) {
    total += await stampCollection(Model, tenantId);
  }

  line();
  console.log(`\n✅  ${total} document(s) updated in total`);

  // ── Verify ────────────────────────────────────────────────────────────────
  console.log('\n🔍  Verification — documents carrying this tenantId:\n');
  for (const [name, Model] of Object.entries(MODELS)) {
    const stamped = await Model.countDocuments({ tenantId });
    const orphans = await Model.countDocuments(MISSING_FILTER);
    const flag    = orphans > 0 ? `  ⚠️  ${orphans} still missing` : '';
    console.log(`  ${pad(name)} ${stamped} stamped${flag}`);
  }

  line();
  console.log('\n🏁  Done.\n');
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('\n❌  Migration failed:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
