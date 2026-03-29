const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  key:      { type: String, required: true, trim: true },
  type:     { type: String, enum: ['text', 'date', 'number', 'boolean', 'dropdown', 'textarea'], default: 'text' },
  required: { type: Boolean, default: true },
  editable: { type: Boolean, default: true },
  regex:    { type: String, default: '' },
  options:  { type: [String], default: [] },
}, { _id: false });

const imageSchema = new mongoose.Schema({
  id:        { type: String, required: true },
  src:       { type: String, required: true },   // base64 data-URL
  x:         { type: Number, default: 0 },
  y:         { type: Number, default: 0 },
  width:     { type: Number, default: 200 },
  height:    { type: Number, default: 150 },
  pageIndex: { type: Number, default: 0 },
  locked:    { type: Boolean, default: false },
}, { _id: false });

const templateSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  notes:       { type: String, default: '' },
  fields:      { type: [fieldSchema], default: [] },
  images:      { type: [imageSchema], default: [] },
  status:      { type: String, enum: ['DRAFT', 'LIVE'], default: 'DRAFT' },
  createdBy:   { type: String, default: 'Admin' },
}, { timestamps: true });

module.exports = mongoose.model('CertificateTemplate', templateSchema);
