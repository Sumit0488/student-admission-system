'use strict';
const mongoose = require('mongoose');

const termSchema = new mongoose.Schema({
  term_name:  { type: String, default: '' },
  start_date: { type: Date },
  end_date:   { type: Date },
}, { _id: false });

const batchSchema = new mongoose.Schema({
  tenantId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
  batch_name:  { type: String, required: true, trim: true },
  stream_code: { type: String, required: true, index: true },
  stream_name: { type: String, default: '' },
  stream_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Stream', default: null },
  start_year:  { type: Number, required: true },
  end_year:    { type: Number },
  status:      { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  terms:       [termSchema],
}, { timestamps: true });

batchSchema.index({ tenantId: 1, stream_code: 1, batch_name: 1 }, { unique: false });

module.exports = mongoose.model('Batch', batchSchema);
