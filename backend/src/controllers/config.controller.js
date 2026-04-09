const Config = require('../models/config.model');
const MasterData = require('../models/master-data.model');

const VALID_TYPES = ['program', 'batch', 'status'];

// ─── GET /api/config ──────────────────────────────────────────────────────────
// Returns all config types in one request (reduces frontend round-trips)
const getAllConfigs = async (_req, res) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CONFIG API HIT  →  GET /api/config');

    const [programs, batches, statuses, quotaRows] = await Promise.all([
      Config.find({ type: 'program' }).sort({ order: 1, value: 1 }),
      Config.find({ type: 'batch' }).sort({ order: 1, value: 1 }),
      Config.find({ type: 'status' }).sort({ order: 1, value: 1 }),
      MasterData.find({ type: 'quota', isActive: true }).sort({ order: 1, label: 1 }),
    ]);

    const data = {
      programs: programs.map((i) => i.value),
      batches: batches.map((i) => i.value),
      statuses: statuses.map((i) => i.value),
      quotas: quotaRows.map((i) => i.label),
    };

    console.log(
      `✅ Config loaded — programs:${data.programs.length} batches:${data.batches.length} statuses:${data.statuses.length} quotas:${data.quotas.length}`
    );
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    res.json({ success: true, data });
  } catch (err) {
    console.error('❌ getAllConfigs error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET /api/config/:type ────────────────────────────────────────────────────
// Returns values for a single type: /api/config/program, /api/config/batch, etc.
const getConfigByType = async (req, res) => {
  try {
    const { type } = req.params;
    console.log(`CONFIG BY TYPE  →  GET /api/config/${type}`);

    if (!VALID_TYPES.includes(type))
      return res.status(400).json({
        success: false,
        error: `Invalid config type "${type}". Must be one of: ${VALID_TYPES.join(', ')}`,
      });

    const items = await Config.find({ type }).sort({ order: 1, value: 1 });
    res.json({ success: true, data: items.map((i) => i.value) });
  } catch (err) {
    console.error('❌ getConfigByType error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getAllConfigs, getConfigByType };
