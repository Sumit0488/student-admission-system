const mongoose = require('mongoose');
const dns = require('dns');

// Node.js v17+ defaults to 'verbatim' DNS order, which on Windows tries
// [::1]:53 (IPv6 loopback) first. If the local DNS resolver only binds to
// IPv4, the SRV lookup gets ECONNREFUSED before it ever reaches Atlas.
// Fix 1: Tell Node.js to prefer IPv4 for all DNS address resolutions.
dns.setDefaultResultOrder('ipv4first');

// Fix 2: Bypass the local Windows DNS resolver entirely for SRV lookups.
// Use well-known public resolvers that are reachable over IPv4.
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

// ─── Connection cache ─────────────────────────────────────────────────────────
let connectionPromise = null;

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI is not defined in environment variables');
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  // Already open — reuse
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose.connection);

  // Broken/disconnected — clear the stale promise and reconnect
  if (connectionPromise && [0, 3].includes(mongoose.connection.readyState)) {
    connectionPromise = null;
  }

  if (!connectionPromise) {
    console.log('[DB] Opening new MongoDB connection in connectDB...');
    connectionPromise = mongoose
      .connect(uri, {
        family: 4, // Force IPv4 at the TCP socket level
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 60000,
        connectTimeoutMS: 30000,
      })
      .then((conn) => {
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
        return conn;
      })
      .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
        connectionPromise = null; // reset so next request retries
        throw err;
      });
  }

  return connectionPromise;
};

module.exports = connectDB;
