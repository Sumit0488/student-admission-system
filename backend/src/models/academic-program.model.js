const mongoose = require('mongoose');

const academicProgramSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  program_name: { type: String, required: true },
  program_code: { type: String, required: true },
  stream_code: { type: String },
  stream_level: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('AcademicProgram', academicProgramSchema);
