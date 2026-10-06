const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // A malformed :id in the URL (bad ObjectId) is a client input problem,
  // not a server fault — every `:id` route across the API hits this the
  // same way, so it's handled once here instead of per-controller.
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path === '_id' ? 'ID' : err.path} format`
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
