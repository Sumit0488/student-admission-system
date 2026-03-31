require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Certificate = require('../src/models/certificate.model');

async function resetCerts() {
  try {
    console.log('⏳ Connecting to Database...');
    await connectDB();
    console.log('✅ Connected.');

    console.log('🧹 Clearing all stored PDFs and resetting status to "Pending"...');
    const result = await Certificate.updateMany(
      {},
      {
        $unset: { pdfBase64: "" },
        $set: { status: "Pending" }
      }
    );

    console.log(`✨ DONE! Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ MIGRATION FAILED:', err.message);
    process.exit(1);
  }
}

resetCerts();
