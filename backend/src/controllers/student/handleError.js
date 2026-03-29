// ─── Shared error handler for all student controllers ────────────────────────
// Maps AppError / Mongoose errors → clean HTTP response

const handleError = (err, res, action) => {
  console.error(`❌ [${action}]`, err.message);

  if (err.isOperational)
    return res.status(err.statusCode).json({ success: false, action, error: err.message });

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ success: false, action, error: `Duplicate value for: ${field}` });
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join('; ');
    return res.status(400).json({ success: false, action, error: message });
  }

  if (err.name === 'CastError')
    return res.status(400).json({ success: false, action, error: `Invalid ID: ${err.value}` });

  return res.status(500).json({ success: false, action, error: 'Internal server error' });
};

module.exports = handleError;
