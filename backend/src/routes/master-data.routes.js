'use strict';
const express    = require('express');
const router     = express.Router();
const MasterData = require('../models/master-data.model');

// ── Default seed values ────────────────────────────────────────────────────────
const DEFAULTS = {
  // Static system fields — admin CANNOT add new values via UI
  gender:          { addable: false, labels: ['Male', 'Female', 'Other'] },
  blood_group:     { addable: false, labels: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
  religion:        { addable: false, labels: ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other'] },
  caste:           { addable: false, labels: ['General', 'SC', 'ST', 'OBC', 'EWS'] },
  mother_tongue:   { addable: false, labels: ['Kannada', 'Hindi', 'English', 'Tamil', 'Telugu', 'Malayalam', 'Urdu', 'Marathi', 'Other'] },
  area:            { addable: false, labels: ['Rural', 'Urban', 'Semi-Urban'] },
  address_type:    { addable: false, labels: ['Permanent', 'Current', 'Communication'] },
  marks_card_type: { addable: false, labels: ['10th (SSLC)', '12th (PUC)', 'Diploma', 'Degree'] },
  score_type:      { addable: false, labels: ['Percentage', 'CGPA', 'Grade'] },
  seat_category:   { addable: false, labels: ['GM', 'SC', 'ST', 'OBC', 'EWS', 'Management', 'NRI', 'SNQ'] },
  kannada:         { addable: false, labels: ['Balake Kannada', 'Samskrutika Kannada'] },
  admission_mode:  { addable: false, labels: ['Management', 'CET', 'COMEDK', 'NRI'] },

  // User-addable fields — admin CAN manage these via Academic Settings UI
  program:         { addable: true, labels: [
    'Computer Science and Engineering',
    'Electronics and Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Artificial Intelligence & ML',
    'Information Science',
    'Electrical & Electronics',
    'MBA', 'MCA', 'M.Tech',
  ]},
  batch:           { addable: true, labels: [
    '2019-2023', '2020-2024', '2021-2025', '2022-2026', '2023-2027', '2024-2028',
  ]},
  stream:          { addable: true, labels: [
    'B.E Computer Science & Engineering',
    'B.E Electronics & Communication',
    'B.E Mechanical Engineering',
    'B.E Civil Engineering',
    'B.E Artificial Intelligence & ML',
    'B.E Information Science',
    'B.E Electrical & Electronics',
    'MBA', 'MCA', 'M.Tech',
  ]},
  academic_year:   { addable: true, labels: ['2022-23', '2023-24', '2024-25', '2025-26', '2026-27'] },
  admission_status: { addable: true, labels: ['Live', 'Completed', 'Cancelled', 'Detained', 'Pass Out'] },
  quota:           { addable: true, labels: ['Management', 'CET', 'COMEDK', 'NRI', 'Government', 'Minority', 'SNQ'] },
  exam:            { addable: true, labels: ['KCET', 'COMEDK', 'JEE Main', 'JEE Advanced', 'NATA', 'Management', 'Other'] },
  subject:         { addable: true, labels: ['Physics', 'Chemistry', 'Mathematics', 'English', 'Computer Science', 'Electronics', 'Biology', 'Statistics'] },
};

// ── Helper: get tenant filter ─────────────────────────────────────────────────
const getTenantFilter = (tenantId) =>
  tenantId ? { tenantId: { $in: [tenantId, null] } } : { tenantId: null };

// ── Seed all defaults ─────────────────────────────────────────────────────────
async function seedDefaults(tenantId = null) {
  const desired = [];
  for (const [type, { addable, labels }] of Object.entries(DEFAULTS)) {
    labels.forEach((label, i) => {
      const value = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
      desired.push({ type, label, value, isUserAddable: addable, order: i, isActive: true, tenantId: null });
    });
  }

  // Fetch all existing global (tenantId=null) type+label pairs
  const existing = await MasterData.find({ tenantId: null }, { type: 1, label: 1 }).lean();
  const existingKeys = new Set(existing.map((d) => `${d.type}::${d.label}`));

  const toInsert = desired.filter((d) => !existingKeys.has(`${d.type}::${d.label}`));
  if (toInsert.length > 0) {
    await MasterData.insertMany(toInsert, { ordered: false }).catch(() => {});
  }
  return toInsert.length;
}

// POST /api/master-data/seed
router.post('/seed', async (_req, res) => {
  try {
    const count = await seedDefaults();
    res.json({ success: true, seeded: count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/master-data/types
router.get('/types', async (_req, res) => {
  try {
    const types = await MasterData.distinct('type', { isActive: true });
    res.json({ success: true, data: types.sort() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/master-data?type=gender
router.get('/', async (req, res) => {
  try {
    const tenantFilter = getTenantFilter(req.tenantId);
    const filter = { isActive: true, ...tenantFilter };
    if (req.query.type) filter.type = req.query.type;
    const data = await MasterData.find(filter).sort({ order: 1, label: 1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/master-data
router.post('/', async (req, res) => {
  try {
    const { type, label } = req.body;
    if (!type?.trim() || !label?.trim()) {
      return res.status(400).json({ success: false, error: 'type and label are required' });
    }

    // Check if this type allows user additions
    const typeMeta = DEFAULTS[type];
    if (typeMeta && !typeMeta.addable) {
      return res.status(403).json({ success: false, error: `Cannot add new values to "${type}"` });
    }

    const tenantId = req.tenantId || null;
    const existing = await MasterData.findOne({ type, label: label.trim(), tenantId });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        await existing.save();
        return res.json({ success: true, data: existing });
      }
      return res.status(400).json({ success: false, error: 'Value already exists' });
    }
    const maxOrder = await MasterData.findOne({ type, tenantId: { $in: [tenantId, null] } }).sort({ order: -1 });
    const order = maxOrder ? maxOrder.order + 1 : 0;
    const value = label.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const isUserAddable = typeMeta ? typeMeta.addable : true;
    const item = await MasterData.create({ type, label: label.trim(), value, order, isUserAddable, tenantId });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/master-data/:id
router.put('/:id', async (req, res) => {
  try {
    const { label } = req.body;
    const update = {};
    if (label !== undefined) {
      update.label = label.trim();
      update.value = label.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    }
    if (req.body.order !== undefined) update.order = req.body.order;
    if (req.body.isActive !== undefined) update.isActive = req.body.isActive;

    const item = await MasterData.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/master-data/:id (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const item = await MasterData.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    if (!item.isUserAddable) return res.status(403).json({ success: false, error: 'System items cannot be deleted' });
    await MasterData.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
module.exports.seedDefaults = seedDefaults;
