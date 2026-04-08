const studentService = require('../../services/student.service');
const handleError = require('./handleError');
const ExcelJS = require('exceljs');

// Short-lived cache header for read endpoints — Vercel CDN caches for 30 s,
// browser treats as fresh for 10 s and may revalidate in background.
const READ_CACHE = 'public, s-maxage=30, stale-while-revalidate=60';

// ─── READ ALL  GET /api/students?q=&program=&batch=&status=&page=&limit= ──────
const getStudents = async (req, res) => {
  try {
    const result = await studentService.getStudents(req.query, req.tenantId);
    res.setHeader('Cache-Control', READ_CACHE);
    return res.json({
      success: true,
      action: 'READ',
      data: result.students,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (err) {
    return handleError(err, res, 'READ');
  }
};

// ─── STATUS COUNTS  GET /api/students/counts ──────────────────────────────────
const getStatusCounts = async (req, res) => {
  try {
    const counts = await studentService.getStatusCounts(req.tenantId);
    res.setHeader('Cache-Control', READ_CACHE);
    return res.json({ success: true, action: 'COUNTS', data: counts });
  } catch (err) {
    return handleError(err, res, 'COUNTS');
  }
};

// ─── DASHBOARD  GET /api/students/dashboard ───────────────────────────────────
// Merged endpoint: counts + first page of Live students in ONE round trip.
// Eliminates two sequential API calls the Students page currently makes.
const getDashboard = async (req, res) => {
  try {
    const [counts, result] = await Promise.all([
      studentService.getStatusCounts(req.tenantId),
      studentService.getStudents(
        { ...req.query, status: 'Live', page: 1, limit: 20 },
        req.tenantId
      ),
    ]);
    res.setHeader('Cache-Control', READ_CACHE);
    return res.json({
      success: true,
      action: 'DASHBOARD',
      counts,
      data: result.students,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (err) {
    return handleError(err, res, 'DASHBOARD');
  }
};

// ─── READ ONE  GET /api/students/:id ──────────────────────────────────────────
const getStudentById = async (req, res) => {
  try {
    const data = await studentService.getStudentById(req.params.id);
    return res.json({ success: true, action: 'READ', data });
  } catch (err) {
    return handleError(err, res, 'READ');
  }
};

// ─── SEARCH  GET /api/students/search?name= ───────────────────────────────────
const searchStudents = async (req, res) => {
  const query = req.query.name || '';
  try {
    const data = await studentService.searchStudents(query, req.tenantId);
    return res.json({ success: true, action: 'SEARCH', data });
  } catch (err) {
    return handleError(err, res, 'SEARCH');
  }
};

// ─── EXPORT  GET /api/students/export?program= ────────────────────────────────
const exportStudents = async (req, res) => {
  try {
    const rows = await studentService.exportStudents(req.query, req.tenantId);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: req.query.program
          ? `No live students found for branch "${req.query.program}".`
          : 'No live students found.',
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Student Admission System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Students');
    sheet.columns = [
      { header: 'USN', key: 'usn', width: 24 },
      { header: 'Student Name', key: 'name', width: 28 },
      { header: 'Student Email', key: 'email', width: 36 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
      cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'center' : 'left' };
      cell.border = { bottom: { style: 'medium', color: { argb: 'FF1E40AF' } } };
    });
    headerRow.height = 20;

    rows.forEach((r, i) => {
      const row = sheet.addRow({ usn: r.usn, name: r.name, email: r.email });
      const isEven = i % 2 === 1;
      row.eachCell((cell, colNumber) => {
        cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'center' : 'left' };
        if (isEven)
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F9FF' } };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
      });
      row.height = 18;
    });

    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    const branch = req.query.program ? req.query.program.replace(/[^a-zA-Z0-9]/g, '_') : 'all';
    const filename = `students_${branch}_live.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    return res.end();
  } catch (err) {
    return handleError(err, res, 'EXPORT');
  }
};

// ─── FULL REPORT  GET /api/students/export/report ────────────────────────────
const STATUS_COLORS = {
  Live: { header: 'FF16A34A', stripe: 'FFF0FDF4' },
  Completed: { header: 'FF1D4ED8', stripe: 'FFF0F9FF' },
  Cancelled: { header: 'FFDC2626', stripe: 'FFFEF2F2' },
  Detained: { header: 'FFD97706', stripe: 'FFFEFCE8' },
};

const exportFullReport = async (req, res) => {
  try {
    const { groups, total } = await studentService.exportFullReport(req.tenantId);

    if (total === 0) {
      return res.status(404).json({ success: false, error: 'No students found in the database.' });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Student Admission System';
    workbook.created = new Date();

    const styleHeader = (row, headerArgb) => {
      row.height = 20;
      row.eachCell((cell) => {
        cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerArgb } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { bottom: { style: 'medium', color: { argb: headerArgb } } };
      });
    };

    const styleDataRow = (row, isEven, stripeArgb) => {
      row.height = 18;
      row.eachCell((cell, col) => {
        cell.alignment = { vertical: 'middle', horizontal: col === 1 ? 'center' : 'left' };
        if (isEven)
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: stripeArgb } };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
      });
    };

    const overview = workbook.addWorksheet('Overview');
    overview.columns = [
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Students', key: 'count', width: 12 },
      { header: '% of Total', key: 'percent', width: 14 },
    ];
    styleHeader(overview.getRow(1), 'FF334155');

    const statuses = ['Live', 'Completed', 'Cancelled', 'Detained'];
    statuses.forEach((s, i) => {
      const count = groups[s].length;
      const percent = total > 0 ? ((count / total) * 100).toFixed(1) + '%' : '0%';
      const row = overview.addRow({ status: s, count, percent });
      styleDataRow(row, i % 2 === 1, 'FFF8FAFC');
      row.getCell(1).font = { bold: true, color: { argb: STATUS_COLORS[s].header } };
    });

    const totalsRow = overview.addRow({ status: 'Total', count: total, percent: '100%' });
    totalsRow.height = 18;
    totalsRow.eachCell((cell) => {
      cell.font = { bold: true, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'medium', color: { argb: 'FF94A3B8' } } };
    });
    overview.views = [{ state: 'frozen', ySplit: 1 }];

    statuses.forEach((status) => {
      const rows = groups[status];
      const color = STATUS_COLORS[status];
      const sheet = workbook.addWorksheet(status);
      sheet.columns = [
        { header: 'USN', key: 'usn', width: 24 },
        { header: 'Student Name', key: 'name', width: 28 },
        { header: 'Email', key: 'email', width: 34 },
        { header: 'Program', key: 'program', width: 22 },
        { header: 'Batch', key: 'batch', width: 14 },
        { header: 'Semester', key: 'semester', width: 10 },
      ];
      styleHeader(sheet.getRow(1), color.header);
      if (rows.length === 0) {
        const empty = sheet.addRow({
          usn: 'No students in this category',
          name: '',
          email: '',
          program: '',
          batch: '',
          semester: '',
        });
        empty.getCell(1).font = { italic: true, color: { argb: 'FF94A3B8' } };
        sheet.mergeCells('A2:F2');
      } else {
        rows.forEach((r, i) => {
          const row = sheet.addRow(r);
          styleDataRow(row, i % 2 === 1, color.stripe);
          row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
          row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };
        });
      }
      sheet.views = [{ state: 'frozen', ySplit: 1 }];
    });

    const date = new Date().toISOString().slice(0, 10);
    const filename = `students_full_report_${date}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    return res.end();
  } catch (err) {
    return handleError(err, res, 'EXPORT_REPORT');
  }
};

// ─── DISTINCT PROGRAMS  GET /api/students/programs ───────────────────────────
const getDistinctPrograms = async (_req, res) => {
  try {
    const programs = await studentService.getDistinctPrograms();
    res.setHeader('Cache-Control', READ_CACHE);
    return res.json({ success: true, data: programs });
  } catch (err) {
    return handleError(err, res, 'PROGRAMS');
  }
};

module.exports = {
  getStudents,
  getStatusCounts,
  getDashboard,
  getStudentById,
  searchStudents,
  exportStudents,
  exportFullReport,
  getDistinctPrograms,
};
