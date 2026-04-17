'use strict';
const mongoose = require('mongoose');

const formSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    content: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'live'], default: 'live' },
    created_by: { type: String, trim: true, default: 'Admin' },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Form', formSchema);
