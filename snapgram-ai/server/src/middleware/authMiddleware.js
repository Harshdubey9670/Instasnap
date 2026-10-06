const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const logger = require('../utils/logger');

// Hash token helper
const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

/**
 * Protect middleware:
 * - Accepts JWT from HttpOnly cookie (web) or Authorization Bearer header (mobile/API)
 * - Verifies cryptographic JWT signature
 * - Enforces session validity and revocation against hashed sessions in DB
 * - Handles transparent migration of legacy unhashed session tokens
 * - Strips sensitive fields (password, otp, otpExpires, sessions) from req.user
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // 2. Check HttpOnly cookie
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const tokenHash = hashToken(token);

    // Fetch user with sessions to verify revocation
    const user = await User.findById(decoded.id).select('+sessions');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }

    // Verify session has not been revoked
    // Check for hashed token match, with backward-compatibility for legacy unhashed session tokens
    const activeSessions = user.sessions || [];
    let matchedIndex = activeSessions.findIndex((s) => s.token === tokenHash);

    if (matchedIndex === -1) {
      // Check if it's a legacy unhashed token in the sessions list
      matchedIndex = activeSessions.findIndex((s) => s.token === token);
      if (matchedIndex !== -1) {
        // Transparent migration: upgrade legacy unhashed token to hash in DB
        activeSessions[matchedIndex].token = tokenHash;
        activeSessions[matchedIndex].lastActive = Date.now();
        await user.save();
      } else if (activeSessions.length > 0) {
        // Sessions exist but none match this token -> revoked
        return res.status(401).json({
          success: false,
          message: 'Not authorized, session has been revoked or expired'
        });
      }
      // If user has zero sessions recorded (e.g. test or newly migrated account without session tracking yet),
      // we allow it and record the session
      if (activeSessions.length === 0) {
        user.sessions.push({
          token: tokenHash,
          deviceString: req.headers['user-agent'] || 'Unknown Device',
          ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'Unknown IP',
          lastActive: Date.now(),
        });
        await user.save();
      }
    } else {
      // Update lastActive timestamp on session (throttled to once every 5 minutes)
      const session = activeSessions[matchedIndex];
      if (Date.now() - new Date(session.lastActive).getTime() > 5 * 60 * 1000) {
        session.lastActive = Date.now();
        await user.save().catch(() => {});
      }
    }

    // CSRF Check for mutating methods if authentication came from cookie without Bearer header
    const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    const usedCookieAuth = Boolean(req.cookies?.token && (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')));
    if (usedCookieAuth && isMutating) {
      const csrfHeader = req.headers['x-csrf-token'];
      const csrfCookie = req.cookies['csrf-token'];
      if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
        return res.status(403).json({ success: false, message: 'Invalid or missing CSRF token' });
      }
    }

    // Attach safe user object to request
    req.user = {
      _id: user._id,
      id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      avatar: user.avatar,
      role: user.role,
      isVerified: user.isVerified,
      isPrivate: user.isPrivate,
      isSuperAdmin: user.isSuperAdmin,
    };

    return next();
  } catch (error) {
    logger.warn('Auth token verification failed', { error: error.message });
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

/**
 * Require Verified middleware:
 * Blocks unverified accounts from mutating content or accessing features that require verification.
 */
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Account not verified. Please verify your email with OTP.',
      requiresVerification: true,
    });
  }
  return next();
};

const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.isSuperAdmin)) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Forbidden: Access restricted to administrators only' });
};

module.exports = { protect, requireVerified, adminOnly, hashToken };
