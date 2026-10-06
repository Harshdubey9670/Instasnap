/**
 * Production Environment Variable Validator
 * Validates essential environment variables on server boot to prevent silent runtime failures.
 */

const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
];

// These are not required to boot, but their absence disables key features
const featureEnvVars = [
  { name: 'CLOUDINARY_CLOUD_NAME', feature: 'Cloudinary media uploads' },
  { name: 'CLOUDINARY_API_KEY',    feature: 'Cloudinary media uploads' },
  { name: 'CLOUDINARY_API_SECRET', feature: 'Cloudinary media uploads' },
  { name: 'GEMINI_API_KEY',        feature: 'AI features (captions, chat, etc.)' },
  { name: 'CLIENT_URL',            feature: 'CORS origin allowlist' },
  { name: 'EMAIL_HOST',            feature: 'Transactional email / OTP delivery' },
];

exports.validateEnv = () => {
  const missing = [];

  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    console.error('❌ [FATAL] Missing required environment variables:', missing.join(', '));
    console.error('Please configure these variables in server/.env before starting the server.');
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  } else {
    console.log('✅ [ENV] Required environment variables validated successfully.');
  }

  // Warn about missing feature env vars (non-fatal)
  featureEnvVars.forEach(({ name, feature }) => {
    if (!process.env[name]) {
      console.warn(`⚠️  [ENV] ${name} is not set — ${feature} will be unavailable.`);
    }
  });

  // Set default fallbacks
  process.env.PORT = process.env.PORT || '5001';
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
};
