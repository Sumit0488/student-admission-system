'use strict';
const Config     = require('../models/config.model');
const MasterData = require('../models/master-data.model');

const VALID_TYPES = ['program', 'batch', 'status', 'stream', 'academic_year', 'admission_status', 'quota'];

// ── Helper ────────────────────────────────────────────────────────────────────
const tenantFilter = (tenantId) =>
  tenantId ? { tenantId: { $in: [tenantId, null] } } : {};

// ── GET /api/config ───────────────────────────────────────────────────────────
// Returns all academic config types in one request (used by all dropdowns)
const getAllConfigs = async (req, res) => {
  try {
    const tf = tenantFilter(req.tenantId);

    // Read from MasterData for all types (single source of truth)
    const [mdPrograms, mdBatches, mdStreams, mdAcademicYears, mdStatuses, mdQuotas,
           cfgPrograms, cfgBatches, cfgStatuses] = await Promise.all([
      MasterData.find({ type: 'program',          isActive: true, ...tf }).sort({ order: 1, label: 1 }),
      MasterData.find({ type: 'batch',             isActive: true, ...tf }).sort({ order: 1, label: 1 }),
      MasterData.find({ type: 'stream',            isActive: true, ...tf }).sort({ order: 1, label: 1 }),
      MasterData.find({ type: 'academic_year',     isActive: true, ...tf }).sort({ order: 1, label: 1 }),
      MasterData.find({ type: 'admission_status',  isActive: true, ...tf }).sort({ order: 1, label: 1 }),
      MasterData.find({ type: 'quota',             isActive: true, ...tf }).sort({ order: 1, label: 1 }),
      // Legacy Config model — include for backward compat
      Config.find({ type: 'program' }).sort({ order: 1, value: 1 }),
      Config.find({ type: 'batch'   }).sort({ order: 1, value: 1 }),
      Config.find({ type: 'status'  }).sort({ order: 1, value: 1 }),
    ]);

    // Merge MasterData + legacy Config (dedup by label/value)
    const mergeLabels = (mdItems, cfgItems) => {
      const set = new Set(mdItems.map(i => i.label));
      const result = mdItems.map(i => i.label);
      for (const c of cfgItems) {
        if (!set.has(c.value)) { result.push(c.value); set.add(c.value); }
      }
      return result;
    };

    const data = {
      programs:       mergeLabels(mdPrograms, cfgPrograms),
      batches:        mergeLabels(mdBatches, cfgBatches),
      streams:        mdStreams.map(i => i.label),
      academicYears:  mdAcademicYears.map(i => i.label),
      statuses:       mergeLabels(mdStatuses, cfgStatuses),
      quotas:         mdQuotas.map(i => i.label),
      // Full objects for management UI
      programItems:   mdPrograms,
      batchItems:     mdBatches,
      streamItems:    mdStreams,
      academicYearItems: mdAcademicYears,
      statusItems:    mdStatuses,
      quotaItems:     mdQuotas,
    };

    res.json({ success: true, data });
  } catch (err) {
    console.error('❌ getAllConfigs error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET /api/config/:type ─────────────────────────────────────────────────────
const getConfigByType = async (req, res) => {
  try {
    const { type } = req.params;
    const tf = tenantFilter(req.tenantId);

    // Map old type names to MasterData types
    const mdType = type === 'status' ? 'admission_status' : type;
    const items = await MasterData.find({ type: mdType, isActive: true, ...tf }).sort({ order: 1, label: 1 });

    // Fallback to legacy Config model for program/batch/status
    if (items.length === 0 && ['program', 'batch', 'status'].includes(type)) {
      const cfg = await Config.find({ type }).sort({ order: 1, value: 1 });
      return res.json({ success: true, data: cfg.map(i => i.value) });
    }

    res.json({ success: true, data: items.map(i => i.label) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getAllConfigs, getConfigByType };
