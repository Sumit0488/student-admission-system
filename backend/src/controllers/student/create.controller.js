const studentService = require('../../services/student.service');
const AuditLog = require('../../models/audit-log.model');
const logActivity = require('../../utils/logActivity');
const handleError = require('./handleError');

// ─── CREATE  POST /api/students ───────────────────────────────────────────────
const createStudent = async (req, res) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('CREATE STUDENT API HIT');
  console.log('POST /api/students');
  console.log('Body :', req.body);
  try {
    const data = await studentService.createStudent(req.body, req.tenantId);
    console.log('✅ Created:', data.name, '|', data.student_id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Audit log — fire-and-forget (non-fatal)
    AuditLog.create({
      studentId: data.id,
      actionType: 'CREATED',
      performedBy: req.user?.email || req.headers['x-user'] || 'admin',
      metadata: { name: data.name, program: data.program, batch: data.batch },
      ...(req.tenantId && { tenantId: req.tenantId }),
    }).catch(() => {});
    logActivity({
      module: 'Admissions', action: 'student_created', label: 'Student Created',
      entityId: data.student_id || String(data._id || data.id), entityLabel: data.name,
      studentName: data.name, usn: data.usn,
      details: `${data.name} enrolled in ${data.program || ''} ${data.batch || ''}`.trim(),
      req,
    });

    return res.status(201).json({ success: true, action: 'CREATE', data });
  } catch (err) {
    return handleError(err, res, 'CREATE');
  }
};

module.exports = { createStudent };
