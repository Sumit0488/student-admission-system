/**
 * Vercel Catch-All Serverless Function
 *
 * Every /api/* request is routed here by vercel.json.
 * We maintain a single cached Mongoose connection across warm invocations.
 */

const mongoose = require('mongoose');

// Must be set BEFORE any models are loaded (before require app)
// so queries buffer long enough for Atlas cold-start connections
mongoose.set('bufferTimeoutMS', 30000);

const app = require('../backend/src/app');

// ─── Connection cache ─────────────────────────────────────────────────────────
// null  → no connection attempt yet
// Promise → connection in progress or resolved
// Reset to null on error so the next request retries cleanly.
let connectionPromise = null;

function ensureConnected() {
  // Already open — reuse
  if (mongoose.connection.readyState === 1) return Promise.resolve();

  // Broken/disconnected — clear the stale promise and reconnect
  if (
    connectionPromise &&
    [0, 3].includes(mongoose.connection.readyState) // 0=disconnected 3=disconnecting
  ) {
    connectionPromise = null;
  }

  if (!connectionPromise) {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      console.error('❌ [DB] MONGO_URI environment variable is not set.');
      return Promise.reject(new Error('MONGO_URI is not configured on this deployment.'));
    }

    console.log('[DB] Opening new MongoDB connection…');

    connectionPromise = mongoose
      .connect(uri, {
        family:                   4,      // force IPv4 — avoids IPv6 SRV lookup issues
        serverSelectionTimeoutMS: 25000,
        socketTimeoutMS:          55000,
        connectTimeoutMS:         25000,
      })
      .then((conn) => {
        console.log(`✅ [DB] Connected to MongoDB: ${conn.connection.host}`);
      })
      .catch((err) => {
        console.error('❌ [DB] Connection failed:', err.message);
        connectionPromise = null; // reset so next request retries
        throw err;
      });
  }

  return connectionPromise;
}

// ─── Serverless handler ───────────────────────────────────────────────────────
module.exports = async (req, res) => {
  console.log(`[API] ${req.method} ${req.url}`);

  try {
    await ensureConnected();
  } catch (err) {
    console.error('[API] Aborting request — DB unavailable:', err.message);
    return res.status(503).json({
      success: false,
      error:   'Database unavailable. Please try again shortly.',
      detail:  process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  return app(req, res);
};
