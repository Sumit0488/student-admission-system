const studentService = require('../../services/student.service');
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
    return res.json({ success: true, action: 'DELETE', message: `"${name}" deleted successfully` });
  } catch (err) {
    return handleError(err, res, 'DELETE');
  }
};

module.exports = { deleteStudent };
