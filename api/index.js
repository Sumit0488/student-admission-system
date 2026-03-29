const mongoose = require('mongoose');

// Cache the connection across warm lambda invocations
let connectionPromise = null;

function ensureConnected() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      })
      .catch((err) => {
        connectionPromise = null; // reset so next request retries
        throw err;
      });
  }
  return connectionPromise;
}

const app = require('../backend/src/app');

module.exports = async (req, res) => {
  try {
    await ensureConnected();
  } catch (err) {
    console.error('DB connection error:', err.message);
    return res.status(503).json({ success: false, error: 'Database connection failed' });
  }
  return app(req, res);
};
