/**
 * Vercel Catch-All Serverless Function
 *
 * Every /api/* request is routed here by vercel.json.
 * We use the backend's own connectDB() so that the same mongoose instance
 * that the models use is the one that gets connected.
 */

// Must be set BEFORE any models are loaded
const mongoose = require('../backend/node_modules/mongoose');
mongoose.set('bufferTimeoutMS', 30000);

const connectDB = require('../backend/src/config/db');
const app       = require('../backend/src/app');

// ─── Serverless handler ───────────────────────────────────────────────────────
module.exports = async (req, res) => {
  console.log(`[API] ${req.method} ${req.url}`);

  try {
    await connectDB();
  } catch (err) {
    console.error('[API] Aborting request — DB unavailable:', err.message);
    return res.status(503).json({
      success: false,
      error:   'Database unavailable. Please try again shortly.',
    });
  }

  return app(req, res);
};
