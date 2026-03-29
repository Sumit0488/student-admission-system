const mongoose = require('mongoose');

const configSchema = new mongoose.Schema(
  {
    type:  {
      type:     String,
      enum:     ['program', 'batch', 'status'],
      required: true,
      index:    true,
    },
    value: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Prevent duplicate type+value pairs
configSchema.index({ type: 1, value: 1 }, { unique: true });

module.exports = mongoose.model('Config', configSchema);
