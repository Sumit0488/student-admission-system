const { AppError } = require('./errorHandler');

// ─── Allowed values ───────────────────────────────────────────────────────────
const VALID_STATUSES = ['Live', 'Completed', 'Cancelled', 'Detained'];
const PHONE_REGEX = /^\+91\d{10}$/;

// ─── Validators ───────────────────────────────────────────────────────────────

const validatePhone = (phone) => {
  if (!phone || phone === '') return null;
  if (!PHONE_REGEX.test(phone))
    return 'Phone must be in format +91XXXXXXXXXX (10 digits after +91)';
  return null;
};

const validateCreateInput = (body) => {
  const { name } = body;
  if (!name || !name.trim()) throw new AppError('Name is required', 400);

  if (!body.program || !body.program.trim()) throw new AppError('Program is required', 400);

  const phoneError = validatePhone(body.phone);
  if (phoneError) throw new AppError(phoneError, 400);
};

const validateStatus = (status) => {
  if (!status) throw new AppError('Status is required', 400);
  if (!VALID_STATUSES.includes(status))
    throw new AppError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 400);
};

const validateUpdateInput = (body) => {
  const phoneError = validatePhone(body.phone);
  if (phoneError) throw new AppError(phoneError, 400);
};

module.exports = {
  VALID_STATUSES,
  validatePhone,
  validateCreateInput,
  validateUpdateInput,
  validateStatus,
};
