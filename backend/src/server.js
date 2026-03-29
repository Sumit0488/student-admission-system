require('dotenv').config();

const http       = require('http');
const connectDB  = require('./config/db');
const app        = require('./app');
const seedConfig  = require('./utils/seedConfig');
const { seedDefaults } = require('./routes/master-data.routes');

const PORT = process.env.PORT || 4000;

async function startServer() {
  await connectDB();
  await seedConfig();
  // Seed master data — non-fatal: server starts even if seeding fails
  seedDefaults().catch((err) => console.warn('⚠️  Master data seed failed (non-fatal):', err.message));

  const httpServer = http.createServer(app);

  await new Promise((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(PORT, resolve);
  });

  console.log(`🚀 Server ready at http://localhost:${PORT}`);
  console.log(`🏥 Health check  at http://localhost:${PORT}/health`);
  console.log(`📚 Students API  at http://localhost:${PORT}/api/students`);
  console.log(`⚙️  Config API    at http://localhost:${PORT}/api/config`);
}

startServer().catch((err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`   Run this to free it, then retry:\n`);
    console.error(`   npx kill-port ${PORT}\n`);
  } else {
    console.error('❌ Failed to start server:', err.message);
  }
  process.exit(1);
});
