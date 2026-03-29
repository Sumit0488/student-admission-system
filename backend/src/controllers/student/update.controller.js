const studentService = require('../../services/student.service');
const handleError     = require('./handleError');

// ─── UPDATE  PUT /api/students/:id ────────────────────────────────────────────
const updateStudent = async (req, res) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('UPDATE STUDENT API HIT');
  console.log('PUT /api/students/:id  |  ID:', req.params.id);
  console.log('Body :', req.body);
  try {
    const data = await studentService.updateStudent(req.params.id, req.body);
    console.log('✅ Updated:', data.name);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return res.json({ success: true, action: 'UPDATE', data });
  } catch (err) {
    return handleError(err, res, 'UPDATE');
  }
};

// ─── CHANGE STATUS  PUT /api/students/:id/status ──────────────────────────────
const changeStatus = async (req, res) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('CHANGE STATUS API HIT');
  console.log('PUT /api/students/:id/status  |  ID:', req.params.id, '| Status:', req.body.status);
  try {
    const data = await studentService.updateStudentStatus(req.params.id, req.body.status);
    console.log(`✅ Status changed: ${data.name} → ${data.status}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return res.json({ success: true, action: 'CHANGE_STATUS', data });
  } catch (err) {
    return handleError(err, res, 'CHANGE_STATUS');
  }
};

module.exports = { updateStudent, changeStatus };
