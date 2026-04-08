// ─── Student Controllers ───────────────────────────────────────────────────────
// Central export — routes import from here, not from individual files

const { createStudent } = require('./create.controller');
const {
  getStudents,
  getStatusCounts,
  getDashboard,
  getStudentById,
  searchStudents,
  exportStudents,
  exportFullReport,
  getDistinctPrograms,
} = require('./read.controller');
const { updateStudent, changeStatus } = require('./update.controller');
const { deleteStudent } = require('./delete.controller');

module.exports = {
  createStudent,
  getStudents,
  getStatusCounts,
  getDashboard,
  getStudentById,
  searchStudents,
  exportStudents,
  exportFullReport,
  getDistinctPrograms,
  updateStudent,
  changeStatus,
  deleteStudent,
};
