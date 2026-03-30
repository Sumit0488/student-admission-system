const express        = require('express');
const cors           = require('cors');
const rateLimit      = require('express-rate-limit');
const studentRoutes    = require('./routes/student.routes');
const configRoutes     = require('./routes/config.routes');
const enquiryRoutes    = require('./routes/enquiry.routes');
const scheduleRoutes   = require('./routes/schedule.routes');
const approvalRoutes   = require('./routes/approval.routes');
const certRoutes           = require('./routes/certificate.routes');
const certRequestRoutes    = require('./routes/certificate-request.routes');
const masterDataRoutes     = require('./routes/master-data.routes');
const eligibilityRoutes    = require('./routes/eligibility.routes');
const { globalErrorHandler } = require('./utils/errorHandler');

const CORS_OPTS = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
  exposedHeaders: ['Content-Disposition'], // allow browser to read filename
};

// Allow max 100 requests per IP per minute across all API routes
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests — please slow down.' },
});

const app = express();

app.use(cors(CORS_OPTS));
app.use(express.json({ limit: '10kb' }));   // reject oversized payloads
app.use('/api', apiLimiter);                 // rate-limit all /api/* routes

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/students',     studentRoutes);
app.use('/api/config',       configRoutes);
app.use('/api/enquiry',      enquiryRoutes);
app.use('/api/schedules',    scheduleRoutes);
app.use('/api/approvals',    approvalRoutes);
app.use('/api/certificates',         certRoutes);
app.use('/api/certificate-requests', certRequestRoutes);
app.use('/api/master-data',          masterDataRoutes);
app.use('/api/eligibility',          eligibilityRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ─── Global error handler (must be last) ──────────────────────────────────────
app.use(globalErrorHandler);

module.exports = app;
