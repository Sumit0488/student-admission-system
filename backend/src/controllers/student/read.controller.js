const studentService = require('../../services/student.service');
const handleError = require('./handleError');

// ─── READ ALL  GET /api/students?q=&program=&batch=&status=&page=&limit= ──────
const getStudents = async (req, res) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('GET STUDENTS API HIT');
  console.log('GET /api/students  |  Query:', req.query);
  try {
    const result = await studentService.getStudents(req.query, req.tenantId);
    console.log(`✅ Found ${result.students.length} / ${result.total} student(s)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('GET STATUS COUNTS API HIT');
  try {
    const counts = await studentService.getStatusCounts(req.tenantId);
    console.log('✅ Counts:', counts);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return res.json({ success: true, action: 'COUNTS', data: counts });
  } catch (err) {
    return handleError(err, res, 'COUNTS');
  }
};

// ─── READ ONE  GET /api/students/:id ──────────────────────────────────────────
const getStudentById = async (req, res) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('GET STUDENT BY ID API HIT');
  console.log('GET /api/students/:id  |  ID:', req.params.id);
  try {
    const data = await studentService.getStudentById(req.params.id);
    console.log('✅ Found:', data.name);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return res.json({ success: true, action: 'READ', data });
  } catch (err) {
    return handleError(err, res, 'READ');
  }
};

// ─── SEARCH  GET /api/students/search?name= ───────────────────────────────────
const searchStudents = async (req, res) => {
  const query = req.query.name || '';
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SEARCH STUDENTS API HIT');
  console.log('GET /api/students/search  |  Query:', query);
  try {
    const data = await studentService.searchStudents(query, req.tenantId);
    console.log(`✅ Search returned ${data.length} result(s)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return res.json({ success: true, action: 'SEARCH', data });
  } catch (err) {
    return handleError(err, res, 'SEARCH');
  }
};

// ─── EXPORT  GET /api/students/export?program= ────────────────────────────────
const ExcelJS = require('exceljs');

const exportStudents = async (req, res) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('EXPORT STUDENTS API HIT');
  console.log('GET /api/students/export  |  Query:', req.query);
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

    // ── Build Excel workbook ───────────────────────────────────────────────────
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Student Admission System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Students');

    // Column definitions — width tuned to typical content lengths
    sheet.columns = [
      { header: 'USN', key: 'usn', width: 24 },
      { header: 'Student Name', key: 'name', width: 28 },
      { header: 'Student Email', key: 'email', width: 36 },
    ];

    // ── Style the header row ───────────────────────────────────────────────────
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } }; // blue-700
      cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'center' : 'left' };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF1E40AF' } },
      };
    });
    headerRow.height = 20;

    // ── Add data rows ──────────────────────────────────────────────────────────
    rows.forEach((r, i) => {
      const row = sheet.addRow({ usn: r.usn, name: r.name, email: r.email });
      const isEven = i % 2 === 1;

      row.eachCell((cell, colNumber) => {
        cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'center' : 'left' };
        if (isEven) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F9FF' } }; // light blue stripe
        }
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
      row.height = 18;
    });

    // Freeze the header row so it stays visible when scrolling
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    // ── File name: students_CSE_live.xlsx  or  students_all_live.xlsx ─────────
    const branch = req.query.program ? req.query.program.replace(/[^a-zA-Z0-9]/g, '_') : 'all';
    const filename = `students_${branch}_live.xlsx`;

    console.log(`✅ Exporting ${rows.length} student(s) → ${filename}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream the workbook directly into the response — no temp file needed
    await workbook.xlsx.write(res);
    return res.end();
  } catch (err) {
    return handleError(err, res, 'EXPORT');
  }
};

// ─── FULL REPORT  GET /api/students/export/report ────────────────────────────
const STATUS_COLORS = {
  Live: { header: 'FF16A34A', stripe: 'FFF0FDF4' }, // green
  Completed: { header: 'FF1D4ED8', stripe: 'FFF0F9FF' }, // blue
  Cancelled: { header: 'FFDC2626', stripe: 'FFFEF2F2' }, // red
  Detained: { header: 'FFD97706', stripe: 'FFFEFCE8' }, // amber
};

const exportFullReport = async (req, res) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('EXPORT FULL REPORT API HIT');
  try {
    const { groups, total } = await studentService.exportFullReport(req.tenantId);

    if (total === 0) {
      return res.status(404).json({ success: false, error: 'No students found in the database.' });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Student Admission System';
    workbook.created = new Date();

    // ── Helper: style a header row ─────────────────────────────────────────────
    const styleHeader = (row, headerArgb) => {
      row.height = 20;
      row.eachCell((cell) => {
        cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerArgb } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { bottom: { style: 'medium', color: { argb: headerArgb } } };
      });
    };

    // ── Helper: style a data row ───────────────────────────────────────────────
    const styleDataRow = (row, isEven, stripeArgb) => {
      row.height = 18;
      row.eachCell((cell, col) => {
        cell.alignment = { vertical: 'middle', horizontal: col === 1 ? 'center' : 'left' };
        if (isEven)
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: stripeArgb } };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
      });
    };

    // ── Sheet 1: Overview summary ──────────────────────────────────────────────
    const overview = workbook.addWorksheet('Overview');
    overview.columns = [
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Students', key: 'count', width: 12 },
      { header: '% of Total', key: 'percent', width: 14 },
    ];
    styleHeader(overview.getRow(1), 'FF334155'); // slate-700

    const statuses = ['Live', 'Completed', 'Cancelled', 'Detained'];
    statuses.forEach((s, i) => {
      const count = groups[s].length;
      const percent = total > 0 ? ((count / total) * 100).toFixed(1) + '%' : '0%';
      const row = overview.addRow({ status: s, count, percent });
      styleDataRow(row, i % 2 === 1, 'FFF8FAFC');
      // Colour the status cell to match its sheet
      row.getCell(1).font = { bold: true, color: { argb: STATUS_COLORS[s].header } };
    });

    // Totals row
    const totalsRow = overview.addRow({ status: 'Total', count: total, percent: '100%' });
    totalsRow.height = 18;
    totalsRow.eachCell((cell) => {
      cell.font = { bold: true, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'medium', color: { argb: 'FF94A3B8' } } };
    });

    overview.views = [{ state: 'frozen', ySplit: 1 }];

    // ── Sheets 2–5: one per status ─────────────────────────────────────────────
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
        sheet.mergeCells(`A2:F2`);
      } else {
        rows.forEach((r, i) => {
          const row = sheet.addRow(r);
          styleDataRow(row, i % 2 === 1, color.stripe);
          // USN center-aligned
          row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
          // Semester center-aligned
          row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };
        });
      }

      sheet.views = [{ state: 'frozen', ySplit: 1 }];
    });

    // ── File name & headers ────────────────────────────────────────────────────
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const filename = `students_full_report_${date}.xlsx`;

    console.log(
      `✅ Full report: ${total} student(s) across ${statuses.length} sheets → ${filename}`
    );
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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
    return res.json({ success: true, data: programs });
  } catch (err) {
    return handleError(err, res, 'PROGRAMS');
  }
};

module.exports = {
  getStudents,
  getStatusCounts,
  getStudentById,
  searchStudents,
  exportStudents,
  exportFullReport,
  getDistinctPrograms,
};
