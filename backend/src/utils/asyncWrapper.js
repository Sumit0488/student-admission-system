const asyncWrapper = (fn) => async (req, res, next) => {
  try {
    await Promise.resolve(fn(req, res, next));
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = asyncWrapper;
