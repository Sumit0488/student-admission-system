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
const accountRoutes = require('./routes/account.routes');
// Fee Management routes
const feeHeadRoutes = require('./routes/fee-head.routes');
const feeCategoryRoutes = require('./routes/fee-category.routes');
const feeStructureRoutes = require('./routes/fee-structure.routes');
const feeScheduleRoutes = require('./routes/fee-schedule.routes');
const feeOrderRoutes = require('./routes/fee-order.routes');
const feeTransactionRoutes = require('./routes/fee-transaction.routes');
const payRecordRoutes = require('./routes/pay-record.routes');
const feeRefundRoutes = require('./routes/fee-refund.routes');
// General routes
const scholarshipRoutes = require('./routes/scholarship.routes');
const bankLoanRoutes = require('./routes/bank-loan.routes');
const generalStudentRoutes = require('./routes/general-student.routes');
// Billing routes
const billingCustomerRoutes = require('./routes/billing-customer.routes');
const billingOrderRoutes = require('./routes/billing-order.routes');
const billingTransactionRoutes = require('./routes/billing-transaction.routes');
const billingPayRecordRoutes = require('./routes/billing-pay-record.routes');
// Hostel routes
const hostelStudentRoutes = require('./routes/hostel-student.routes');
const hostelAssetRoutes = require('./routes/hostel-asset.routes');
const hostelEventRoutes = require('./routes/hostel-event.routes');
const hostelTimesheetRoutes = require('./routes/hostel-timesheet.routes');
const hostelDeviceRoutes = require('./routes/hostel-device.routes');
// Library routes
const libraryMemberRoutes = require('./routes/library-member.routes');
// Alumni routes
const alumniRoutes = require('./routes/alumni.routes');
// Activity Logs
const activityLogRoutes = require('./routes/activity-log.routes');
// Academic Setting routes
const streamRoutes = require('./routes/stream.routes');
const academicProgramRoutes = require('./routes/academic-program.routes');
// Settings route
const settingsRoutes = require('./routes/settings.routes');
const { softAuth, requireAuth } = require('./middleware/auth');
const { globalErrorHandler } = require('./utils/errorHandler');
const superAdminRoutes = require('./routes/super-admin.routes');
const userManagementRoutes = require('./routes/user-management.routes');

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  process.env.FRONTEND_URL,
].filter(Boolean);

const CORS_OPTS = {
  origin: function (origin, callback) {
    // Allow requests with no origin (curl, mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    // Allow any *.vercel.app subdomain (covers all preview + production deployments)
    if (origin.endsWith('.vercel.app') || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  exposedHeaders: ['Content-Disposition'],
};

// Allow max 100 requests per IP per minute across all API routes
// express-rate-limit v8: use `limit` (not `max`) and `standardHeaders: 'draft-7'`
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
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
app.use('/api/super-admin', requireAuth, superAdminRoutes);
app.use('/api/users', requireAuth, userManagementRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/config', configRoutes);
app.use('/api/enquiry', enquiryRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/certificates', certRoutes);
app.use('/api/certificate-requests', certRequestRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/eligibility', eligibilityRoutes);
// Accounts
app.use('/api/accounts', accountRoutes);
// Fee Management
app.use('/api/fee/heads', feeHeadRoutes);
app.use('/api/fee/categories', feeCategoryRoutes);
app.use('/api/fee/structures', feeStructureRoutes);
app.use('/api/fee/schedules', feeScheduleRoutes);
app.use('/api/fee/orders', feeOrderRoutes);
app.use('/api/fee/transactions', feeTransactionRoutes);
app.use('/api/fee/pay-records', payRecordRoutes);
app.use('/api/fee/refunds', feeRefundRoutes);
// General
app.use('/api/general/students', generalStudentRoutes);
app.use('/api/general/scholarships', scholarshipRoutes);
app.use('/api/general/bank-loans', bankLoanRoutes);
// Billing
app.use('/api/billing/customers', billingCustomerRoutes);
app.use('/api/billing/orders', billingOrderRoutes);
app.use('/api/billing/transactions', billingTransactionRoutes);
app.use('/api/billing/pay-records', billingPayRecordRoutes);
// Hostel
app.use('/api/hostel/students', hostelStudentRoutes);
app.use('/api/hostel/assets', hostelAssetRoutes);
app.use('/api/hostel/events', hostelEventRoutes);
app.use('/api/hostel/timesheet', hostelTimesheetRoutes);
app.use('/api/hostel/devices', hostelDeviceRoutes);
// Library
app.use('/api/library/members', libraryMemberRoutes);
// Alumni
app.use('/api/alumni', alumniRoutes);
// Activity Logs
app.use('/api/activity-logs', activityLogRoutes);
// Academic Setting
app.use('/api/academic/streams', streamRoutes);
app.use('/api/academic/programs', academicProgramRoutes);
app.use('/api/settings', settingsRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── Global error handler (must be last) ──────────────────────────────────────
app.use(globalErrorHandler);

module.exports = app;
