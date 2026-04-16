const mongoose = require('mongoose');

const streamSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  stream_id: { type: String },
  stream_name: { type: String, required: true },
  stream_code: { type: String, required: true },
  stream_level: { type: String },
  stream_duration: { type: String },
  no_of_terms: { type: Number },
  term_duration: { type: Number },
  stream_label: { type: String }, // base64 or URL
  institution: {
    organization_name: { type: String, default: '' },
    institution_name: { type: String, default: '' },
    short_name: { type: String, default: '' },
    principal_name: { type: String, default: '' },
    director_name: { type: String, default: '' },
    contact: {
      email: { type: String, default: '' },
      mobile: { type: String, default: '' },
      phone: { type: String, default: '' },
      fax: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    address: {
      address_line1: { type: String, default: '' },
      address_line2: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      postal_code: { type: String, default: '' },
    },
    header: {
      description_1: { type: String, default: '' },
      description_2: { type: String, default: '' },
      description_3: { type: String, default: '' },
    },
  },
  program: [{ program_code: String, program_name: String }],
  quota: [{ quota_code: String, quota_name: String }],
}, { timestamps: true });

module.exports = mongoose.model('Stream', streamSchema);
