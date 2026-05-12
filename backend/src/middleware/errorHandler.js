// Global error handler — Express calls this whenever next(error) is called
// It sits at the very bottom of index.js after all routes
// It catches ALL errors so we don't have to handle them in every route

export function errorHandler(err, req, res, next) {
  // Use the error's status code if it has one, otherwise 500 (server error)
  const status = err.statusCode || 500;
  const message = err.message || 'Something went wrong';

  // Log the full error details to the server console for debugging
  console.error(`[ERROR] ${status} — ${message}`, {
    code: err.code,
    stack: err.stack,
  });

  // Send a clean JSON response to the frontend
  res.status(status).json({
    error: message,
    code: err.code || 'INTERNAL_ERROR',
  });
}
