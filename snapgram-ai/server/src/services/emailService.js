/**
 * Email Service
 * Delivers transactional emails (OTP verification, password reset, etc.)
 * via a configurable SMTP provider (e.g. SendGrid, Mailgun, Resend, Gmail).
 *
 * Required environment variables:
 *   EMAIL_HOST     - SMTP host (e.g. smtp.sendgrid.net)
 *   EMAIL_PORT     - SMTP port (e.g. 587)
 *   EMAIL_USER     - SMTP username / API key identifier
 *   EMAIL_PASS     - SMTP password / API key
 *   EMAIL_FROM     - Sender address (e.g. noreply@snapgram.ai)
 *
 * In development, when EMAIL_HOST is not set, emails are logged to the
 * console only.  They are NOT silently dropped — the caller receives an
 * error so the problem is immediately obvious.
 */

const logger = require('../utils/logger');

/**
 * Lazily create a nodemailer transporter so that startup does not fail if
 * nodemailer is present but EMAIL_HOST is absent (dev mode).
 * Returns null when email is unconfigured.
 */
let _transporter = undefined; // undefined = not yet initialised
const getTransporter = () => {
  if (_transporter !== undefined) return _transporter;

  if (!process.env.EMAIL_HOST) {
    logger.warn('Email service: EMAIL_HOST not configured — emails will be console-logged only (dev mode).');
    _transporter = null;
    return null;
  }

  try {
    // nodemailer is a peer dependency; install it with: npm i nodemailer
    const nodemailer = require('nodemailer');
    _transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: parseInt(process.env.EMAIL_PORT || '587', 10) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    logger.info('Email service: SMTP transporter initialised', { host: process.env.EMAIL_HOST });
    return _transporter;
  } catch (err) {
    logger.error('Email service: failed to create transporter — nodemailer may not be installed', err);
    _transporter = null;
    return null;
  }
};

/**
 * Send a one-time-password to the user's email address.
 * @param {string} to      - Recipient email address
 * @param {string} otp     - The plaintext OTP to deliver (never stored as-is)
 * @param {string} purpose - 'verification' | 'password_reset'
 * @returns {Promise<{ delivered: boolean, devOnly: boolean }>}
 */
exports.sendOtpEmail = async (to, otp, purpose = 'verification') => {
  const subjectMap = {
    verification: 'SnapGram — Verify your email',
    password_reset: 'SnapGram — Reset your password',
  };
  const bodyMap = {
    verification: `
      <h2>Welcome to SnapGram!</h2>
      <p>Your email verification code is:</p>
      <h1 style="letter-spacing:8px;color:#8b5cf6;">${otp}</h1>
      <p>This code expires in <strong>10 minutes</strong>.</p>
      <p>If you did not create a SnapGram account, ignore this email.</p>
    `,
    password_reset: `
      <h2>SnapGram — Password Reset</h2>
      <p>Your password reset code is:</p>
      <h1 style="letter-spacing:8px;color:#8b5cf6;">${otp}</h1>
      <p>This code expires in <strong>10 minutes</strong>. It can only be used once.</p>
      <p>If you did not request a password reset, ignore this email.</p>
    `,
  };

  const subject = subjectMap[purpose] || 'SnapGram — Your verification code';
  const html = bodyMap[purpose] || `<p>Your code: <strong>${otp}</strong> (expires in 10 minutes)</p>`;
  const from = process.env.EMAIL_FROM || 'SnapGram <noreply@snapgram.ai>';

  const transporter = getTransporter();

  if (!transporter) {
    // Dev-only fallback: log to console but do NOT pretend delivery succeeded
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`[DEV] Email delivery skipped (EMAIL_HOST not configured)`, { to, purpose });
      return { delivered: false, devOnly: true };
    }
    // In production, missing email config is a hard error
    throw new Error('Email service is not configured. Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS, and EMAIL_FROM.');
  }

  await transporter.sendMail({ from, to, subject, html });
  logger.info('Email sent', { to, purpose });
  return { delivered: true, devOnly: false };
};
