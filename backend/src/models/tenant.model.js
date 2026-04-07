'use strict';
const mongoose = require('mongoose');

// Auto-generate a short code from institution name
// "Bapuji Institute of Engineering and Technology" → "biet"
// Takes first letter of each significant word (skips: of, and, the, for, a, an, in, at)
const STOP_WORDS = new Set(['of', 'and', 'the', 'for', 'a', 'an', 'in', 'at', 'to', 'by']);

function generateCode(name) {
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STOP_WORDS.has(w))
    .map((w) => w[0])
    .join('');
}

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true, // institution name must be globally unique
    },
    // Short identifier — "biet", "rvce", etc.
    // Stored as `code`; `slug` is kept as a write-through alias so existing
    // documents (which have `slug` but not `code`) continue to work.
    code: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, // allows null/missing without unique-index clash
    },
    // Legacy alias — kept so old documents are not broken
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    domain: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Before saving, ensure `code` is always populated.
// If code is absent, derive it from name.
// Mirror the value into `slug` so legacy code that reads slug still works.
tenantSchema.pre('save', function (next) {
  if (!this.code) {
    this.code = generateCode(this.name);
  }
  this.slug = this.code; // keep slug in sync
  next();
});

tenantSchema.statics.generateCode = generateCode;

module.exports = mongoose.model('Tenant', tenantSchema);
