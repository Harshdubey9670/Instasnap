/**
 * Express 5 Compatible NoSQL Injection Sanitization Middleware
 * Recursively strips keys starting with '$' or containing '.' from req.body, req.params, and req.query.
 * Express 5 protects req.query with a getter, so we modify the object in-place rather than reassigning.
 */

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
};

const sanitizeInput = (req, res, next) => {
  try {
    if (req.body && typeof req.body === 'object') sanitizeObject(req.body);
    if (req.params && typeof req.params === 'object') sanitizeObject(req.params);
    if (req.query && typeof req.query === 'object') sanitizeObject(req.query);
  } catch (err) {
    // Graceful fallback
  }
  next();
};

module.exports = sanitizeInput;
