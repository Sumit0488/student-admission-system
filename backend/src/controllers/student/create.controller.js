const studentService = require('../../services/student.service');
const handleError     = require('./handleError');

// ─── CREATE  POST /api/students ───────────────────────────────────────────────
const createStudent = async (req, res) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('CREATE STUDENT API HIT');
  console.log('POST /api/students');
  console.log('Body :', req.body);
  try {
    const data = await studentService.createStudent(req.body);
    console.log('✅ Created:', data.name, '|', data.student_id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return res.status(201).json({ success: true, action: 'CREATE', data });
  } catch (err) {
    return handleError(err, res, 'CREATE');
  }
};

module.exports = { createStudent };
