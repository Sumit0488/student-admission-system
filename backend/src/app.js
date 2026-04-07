const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const studentRoutes = require('./routes/student.routes');
const configRoutes = require('./routes/config.routes');
const enquiryRoutes = require('./routes/enquiry.routes');
const scheduleRoutes = require('./routes/schedule.routes');
const approvalRoutes = require('./routes/approval.routes');
const certRoutes = require('./routes/certificate.routes');
const certRequestRoutes = require('./routes/certificate-request.routes');
const masterDataRoutes = require('./routes/master-data.routes');
const eligibilityRoutes = require('./routes/eligibility.routes');
const authRoutes = require('./routes/auth.routes');
const { softAuth } = require('./middleware/auth');
const { globalErrorHandler } = require('./utils/errorHandler');

const CORS_OPTS = {
  origin: [
    'http://localhost:3000', // Zudient student frontend
    'http://localhost:3001', // Zudient admin app
    'http://localhost:5173', // Admission admin frontend (default Vite port)
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

app.set('trust proxy', 1); // trust Vercel's reverse proxy for correct IP detection
app.use(cors(CORS_OPTS));

// Certificate template routes carry base64-encoded images — allow up to 10 MB.
// Enquiry routes carry large forms (60+ fields) — allow up to 1 MB.
// All other API routes keep a tighter 100 KB cap.
app.use('/api/certificates/templates', express.json({ limit: '10mb' }));
app.use('/api/enquiry', express.json({ limit: '1mb' }));
app.use(express.json({ limit: '100kb' }));

app.use('/api', apiLimiter); // rate-limit all /api/* routes

// ─── Attach tenantId from JWT to every request (optional — no hard rejection) ─
app.use(softAuth);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/config', configRoutes);
app.use('/api/enquiry', enquiryRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/certificates', certRoutes);
app.use('/api/certificate-requests', certRequestRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/eligibility', eligibilityRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── Global error handler (must be last) ──────────────────────────────────────
app.use(globalErrorHandler);

module.exports = app;
