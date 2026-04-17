const studentService = require('../../services/student.service');
const logActivity = require('../../utils/logActivity');
const handleError     = require('./handleError');

// ─── DELETE  DELETE /api/students/:id ─────────────────────────────────────────
const deleteStudent = async (req, res) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('DELETE STUDENT API HIT');
  console.log('DELETE /api/students/:id  |  ID:', req.params.id);
  try {
    const name = await studentService.deleteStudent(req.params.id);
    console.log('✅ Deleted:', name);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logActivity({
      module: 'Admissions', action: 'student_deleted', label: 'Student Deleted',
      entityId: req.params.id, entityLabel: name,
      studentName: name,
      details: `Student "${name}" deleted`,
      req,
    });
    return res.json({ success: true, action: 'DELETE', message: `"${name}" deleted successfully` });
  } catch (err) {
    return handleError(err, res, 'DELETE');
  }
};

module.exports = { deleteStudent };
