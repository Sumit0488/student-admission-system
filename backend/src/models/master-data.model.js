const mongoose = require('mongoose');

const masterDataSchema = new mongoose.Schema({
  type:          { type: String, required: true, trim: true, index: true },
  label:         { type: String, required: true, trim: true },
  value:         { type: String, required: true, trim: true },
  isActive:      { type: Boolean, default: true, index: true },
  isUserAddable: { type: Boolean, default: false },
  order:         { type: Number, default: 0 },
  tenantId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
}, { timestamps: true });

// Compound index for fast lookups (NOT unique — existing duplicates in DB prevent unique index creation)
masterDataSchema.index({ type: 1, label: 1 });
masterDataSchema.index({ type: 1, isActive: 1, order: 1 });

module.exports = mongoose.model('MasterData', masterDataSchema);
