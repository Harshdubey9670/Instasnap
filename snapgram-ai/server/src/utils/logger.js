/**
 * Production Structured JSON Logger & Monitoring Hooks
 * Formats log messages with timestamps and severity levels for Sentry / Datadog / OpenTelemetry log aggregators.
 */

const SENSITIVE_KEYS = new Set([
  'password', 'token', 'jwt', 'secret', 'otp', 'devotp', 'authorization', 'cookie', 'credential', 'apikey'
]);

const redactSensitive = (obj, depth = 0) => {
  if (!obj || typeof obj !== 'object' || depth > 5) return obj;
  if (Array.isArray(obj)) return obj.map(item => redactSensitive(item, depth + 1));
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = redactSensitive(value, depth + 1);
    } else {
      clean[key] = value;
    }
  }
  return clean;
};

const formatLog = (level, message, meta = {}) => {
  const logObj = {
    timestamp: new Date().toISOString(),
    level,
    message,
    environment: process.env.NODE_ENV || 'development',
    ...redactSensitive(meta)
  };
  return JSON.stringify(logObj);
};

exports.info = (message, meta) => {
  console.log(formatLog('INFO', message, meta));
};

exports.warn = (message, meta) => {
  console.warn(formatLog('WARN', message, meta));
};

exports.error = (message, err, meta = {}) => {
  const errorMeta = {
    ...meta,
    errorName: err?.name,
    errorMessage: err?.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err?.stack
  };
  console.error(formatLog('ERROR', message, errorMeta));

  // Placeholder for Monitoring / Error Reporting Integration (e.g. Sentry / Datadog)
  if (process.env.SENTRY_DSN) {
    // Sentry.captureException(err);
  }
};

// Express Performance & Monitoring Middleware
exports.requestMonitorMiddleware = () => {
  return (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (duration > 1000) {
        exports.warn(`Slow Request Detected: ${req.method} ${req.originalUrl}`, { durationMs: duration });
      }
    });
    next();
  };
};
