// ─── Operational error class ──────────────────────────────────────────────────
// Used for expected errors (validation, not found, duplicate).
// controller.handleError() sends these as HTTP responses with a specific status.

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode  = statusCode;
    this.isOperational = true; // marks as known, safe-to-expose error
  }
}

// ─── Error factories ──────────────────────────────────────────────────────────

const notFound      = (entity = 'Record') => new AppError(`${entity} not found`, 404);
const duplicate     = (field)             => new AppError(`A record with this ${field} already exists`, 409);
const validationErr = (message)           => new AppError(message, 400);

// ─── Express error handler middleware ─────────────────────────────────────────
// Attach to app with: app.use(globalErrorHandler)

const globalErrorHandler = (err, _req, res, _next) => {
  // Mongoose duplicate key (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ success: false, error: `Duplicate value for field: ${field}` });
  }

  // Mongoose schema validation
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join('; ');
    return res.status(400).json({ success: false, error: message });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, error: `Invalid ID format: ${err.value}` });
  }

  // Known operational errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({ success: false, error: err.message });
  }

  // Unexpected errors — log and return generic message
  console.error('[Unhandled Error]', err);
  return res.status(500).json({ success: false, error: 'Internal server error' });
};

module.exports = { AppError, notFound, duplicate, validationErr, globalErrorHandler };
