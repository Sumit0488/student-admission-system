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

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI is not defined in environment variables');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      family: 4,                    // Force IPv4 at the TCP socket level
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
