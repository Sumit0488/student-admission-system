const express = require('express');
const { getTenantFilter } = require('../utils/tenantFilter');
const router = express.Router();
const mongoose = require('mongoose');
const FeeSchedule = require('../models/fee-schedule.model');
const FeeOrder = require('../models/fee-order.model');
const FeeStructure = require('../models/fee-structure.model');
const Student = require('../models/student.model');

router.get('/', async (req, res) => {
  try {
    const tf = getTenantFilter(req.tenantId);
    const filter = { ...tf };
    if (req.query.academic_year) filter.academic_year = req.query.academic_year;
    if (req.query.stream_id) filter.stream_id = req.query.stream_id;
    if (req.query.fee_sched_status) filter.fee_sched_status = req.query.fee_sched_status;
    const data = await FeeSchedule.find(filter).sort({ created_at: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await FeeSchedule.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id/stats', async (req, res) => {
  try {
    const scheduleId = req.params.id;

    // Aggregate per-program stats
    const programStats = await FeeOrder.aggregate([
      { $match: { fee_schedule_id: new (require('mongoose').Types.ObjectId)(scheduleId) } },
      {
        $group: {
          _id: '$program',
          total: { $sum: 1 },
          not_paid: {
            $sum: {
              $cond: [{ $eq: ['$fee_paid_amount', 0] }, 1, 0],
            },
          },
          partial: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ['$fee_paid_amount', 0] },
                    { $lt: ['$fee_paid_amount', '$fee_order_amount'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          paid_full: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ['$fee_order_amount', 0] },
                    { $gte: ['$fee_paid_amount', '$fee_order_amount'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          total_amount: { $sum: '$fee_order_amount' },
          paid_amount: { $sum: '$fee_paid_amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Overall totals
    const overall = programStats.reduce(
      (acc, p) => {
        acc.total += p.total;
        acc.not_paid += p.not_paid;
        acc.partial += p.partial;
        acc.paid_full += p.paid_full;
        acc.total_amount += p.total_amount;
        acc.paid_amount += p.paid_amount;
        return acc;
      },
      { total: 0, not_paid: 0, partial: 0, paid_full: 0, total_amount: 0, paid_amount: 0 }
    );

    res.json({
      success: true,
      data: {
        programs: programStats.map((p) => ({
          program: p._id || 'Unknown',
          total: p.total,
          not_paid: p.not_paid,
          partial: p.partial,
          paid_full: p.paid_full,
          total_amount: p.total_amount,
          paid_amount: p.paid_amount,
        })),
        overall,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const doc = new FeeSchedule({ ...req.body, ...(req.tenantId && { tenantId: req.tenantId }) });
    await doc.save();
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const doc = await FeeSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const doc = await FeeSchedule.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const doc = await FeeSchedule.findByIdAndUpdate(
      req.params.id,
      { fee_sched_status: status },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /:id/create-orders — create fee orders for all matching students from fee structures
router.post('/:id/create-orders', async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const schedule = await FeeSchedule.findById(scheduleId);
    if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });

    // Find all live students
    const studentFilter = { admissionStatus: 'Live', isDeleted: { $ne: true } };
    if (schedule.year_of_study) studentFilter.term = schedule.year_of_study;
    const students = await Student.find(studentFilter).lean();

    // Find fee structures for this schedule's category
    const structureFilter = { fee_category: schedule.fee_category };
    const structures = await FeeStructure.find(structureFilter).lean();

    let created = 0;
    let skipped = 0;

    for (const student of students) {
      // Find best matching fee structure: program+batch > program-only > first available
      const structure =
        structures.find((s) => s.program === student.program && s.batch === student.batch) ||
        structures.find((s) => s.program === student.program) ||
        (structures.length > 0 ? structures[0] : null);

      if (!structure) { skipped++; continue; }

      // Skip if order already exists for this student+schedule
      const existing = await FeeOrder.findOne({
        fee_schedule_id: new mongoose.Types.ObjectId(scheduleId),
        student_id: student._id,
      });
      if (existing) { skipped++; continue; }

      const order = new FeeOrder({
        fee_schedule_id: new mongoose.Types.ObjectId(scheduleId),
        academic_year: schedule.academic_year,
        fee_category: schedule.fee_category,
        fee_type: schedule.fee_type || 'GENERAL',
        term: schedule.term || student.term,
        student_id: student._id,
        student_name: student.fullName,
        usn: student.student_id,
        program: student.program,
        fee_order_amount: structure.fee_total_amount,
        fee_due_amount: structure.fee_total_amount,
        fee_paid_amount: 0,
        order_status: 'created',
        fee_particulars: (structure.fee_structure || []).map((fh) => ({
          fee_head: fh.fee_head,
          fee_head_priority: fh.fee_priority,
          fee_head_amount: fh.fee_head_amount,
          fee_head_paid: 0,
          fee_head_due: fh.fee_head_amount,
          fee_head_status: 'pending',
        })),
      });
      await order.save();
      created++;
    }

    res.json({
      success: true,
      message: `Created ${created} orders, skipped ${skipped}`,
      data: { created, skipped, total: students.length },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /:id/bulk-upload-orders — bulk upload orders via JSON array
router.post('/:id/bulk-upload-orders', async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const schedule = await FeeSchedule.findById(scheduleId);
    if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });

    const rows = req.body.rows || [];
    let created = 0;
    let errors = [];

    for (const row of rows) {
      try {
        const student = await Student.findOne({
          $or: [{ student_id: row.usn }, { email: row.email }],
        }).lean();

        const order = new FeeOrder({
          fee_schedule_id: new mongoose.Types.ObjectId(scheduleId),
          academic_year: schedule.academic_year,
          fee_category: schedule.fee_category,
          fee_type: schedule.fee_type || 'GENERAL',
          term: schedule.term,
          student_id: student ? student._id : undefined,
          student_name: row.student_name || (student ? student.fullName : row.usn),
          usn: row.usn,
          program: row.program || (student ? student.program : ''),
          fee_order_amount: parseFloat(row.fee_order_amount) || 0,
          fee_due_amount: parseFloat(row.fee_order_amount) || 0,
          fee_paid_amount: 0,
          order_status: 'created',
        });
        await order.save();
        created++;
      } catch (e) {
        errors.push({ usn: row.usn, error: e.message });
      }
    }

    res.json({ success: true, data: { created, errors } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
