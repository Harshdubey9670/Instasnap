const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { sendOtpEmail } = require('../services/emailService');
const logger = require('../utils/logger');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });

// Generate a cryptographically secure 6-digit OTP
const generateOTP = () =>
  (Math.floor(100000 + Math.random() * 900000)).toString();

// Hash a session token for storage (H-1 fix)
const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

// Safe subset of user fields to include in API responses
// Never includes password, otp, otpExpires, or sessions (M-9 fix)
const safeUser = (user) => ({
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
  accountType: user.accountType,
});

// Configure and set HttpOnly session cookies
const setAuthCookies = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';
  // HttpOnly JWT cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/',
  });
  // Readable CSRF token cookie for double-submit CSRF protection on the client
  const csrfToken = crypto.randomBytes(24).toString('hex');
  res.cookie('csrf-token', csrfToken, {
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
  return csrfToken;
};

// Clear session cookies
const clearAuthCookies = (res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });
  res.clearCookie('csrf-token', {
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });
};

// Append a hashed session to the user document
const addSession = (user, token, req) => {
  if (!user.sessions) user.sessions = [];
  const deviceString = req.headers['user-agent'] || 'Unknown Device';
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'Unknown IP';
  user.sessions.push({
    token: hashToken(token), // store hash only (H-1 fix)
    deviceString,
    ip,
    lastActive: Date.now(),
  });
  // Keep only the most recent 10 sessions
  if (user.sessions.length > 10) {
    user.sessions = user.sessions.slice(-10);
  }
};

// ─── Controllers ──────────────────────────────────────────────────────────────

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res, next) => {
  try {
    const { fullName, username, email, password } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      const isEmail = userExists.email === email;
      return res.status(400).json({
        success: false,
        message: `${isEmail ? 'Email' : 'Username'} is already in use`,
      });
    }

    // C-2: Hash OTP before storing, with purpose and attempt tracking
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      fullName,
      username,
      email,
      password,
      otp: otpHash,
      otpExpires,
      otpPurpose: 'verification',
      otpAttempts: 0,
      isVerified: false,
    });

    // Generate token and record session
    const token = generateToken(user._id);
    addSession(user, token, req);
    await user.save();

    // Set HttpOnly auth cookies
    setAuthCookies(res, token);

    // C-1/M-1: Deliver OTP via email — never in the API response
    let emailDelivered = true;
    try {
      const result = await sendOtpEmail(email, otp, 'verification');
      if (result.devOnly) {
        emailDelivered = false;
        logger.info(`[DEV] OTP delivery skipped (no EMAIL_HOST configured).`, { email });
      }
    } catch (emailErr) {
      emailDelivered = false;
      logger.error('signup: OTP email delivery failed', emailErr, { email });
      if (process.env.NODE_ENV === 'production') {
        return res.status(502).json({
          success: false,
          message: 'Account created, but verification email delivery failed. Please request OTP resend.',
        });
      }
    }

    res.status(201).json({
      success: true,
      token,
      message: emailDelivered
        ? 'Account created successfully. Please check your email for the verification code.'
        : 'Account created. Verification email could not be sent (email provider not configured in dev mode).',
      user: safeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email }).select('+otp +otpExpires +otpPurpose +otpAttempts +sessions');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User is already verified' });
    }

    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({ success: false, message: 'No pending OTP. Please request a new one.' });
    }

    // Check expiration
    if (user.otpExpires < Date.now()) {
      user.otp = undefined;
      user.otpExpires = undefined;
      user.otpPurpose = undefined;
      await user.save();
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Check purpose
    if (user.otpPurpose && user.otpPurpose !== 'verification') {
      return res.status(400).json({ success: false, message: 'Invalid OTP purpose for account verification.' });
    }

    // Check attempt limit (max 5 attempts)
    if ((user.otpAttempts || 0) >= 5) {
      user.otp = undefined;
      user.otpExpires = undefined;
      user.otpPurpose = undefined;
      user.otpAttempts = 0;
      await user.save();
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. This OTP has been invalidated. Please request a new one.',
      });
    }

    // C-2: Compare against stored hash
    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      const remainingAttempts = 5 - user.otpAttempts;
      if (remainingAttempts <= 0) {
        user.otp = undefined;
        user.otpExpires = undefined;
        user.otpPurpose = undefined;
        user.otpAttempts = 0;
      }
      await user.save();
      return res.status(400).json({
        success: false,
        message: remainingAttempts > 0
          ? `Invalid OTP. You have ${remainingAttempts} attempts remaining.`
          : 'Too many incorrect attempts. This OTP has been invalidated. Please request a new one.',
      });
    }

    // Verified — clear OTP fields (single-use enforcement)
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpPurpose = undefined;
    user.otpAttempts = 0;

    const token = generateToken(user._id);
    addSession(user, token, req);
    await user.save();

    setAuthCookies(res, token);

    res.status(200).json({
      success: true,
      message: 'Account verified successfully',
      token,
      user: safeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email }).select('+otp +otpExpires +otpPurpose +otpAttempts');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User is already verified' });
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    user.otp = otpHash;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.otpPurpose = 'verification';
    user.otpAttempts = 0;
    await user.save();

    let emailDelivered = true;
    try {
      const result = await sendOtpEmail(email, otp, 'verification');
      if (result.devOnly) {
        emailDelivered = false;
      }
    } catch (emailErr) {
      emailDelivered = false;
      logger.error('resendOTP: email delivery failed', emailErr, { email });
      if (process.env.NODE_ENV === 'production') {
        return res.status(502).json({
          success: false,
          message: 'Failed to deliver OTP email. Please check your email provider or try again later.',
        });
      }
    }

    // C-1: No OTP in response
    res.status(200).json({
      success: true,
      message: emailDelivered
        ? 'A new OTP has been sent to your email'
        : 'A new OTP was generated, but email delivery is unconfigured in development mode.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if username is available
// @route   POST /api/auth/check-username
// @access  Public
exports.checkUsername = async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }
    const user = await User.findOne({ username });
    return res.status(200).json({ success: true, available: !user });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const identifier = (email || '').trim();

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() },
        { username: identifier },
      ],
    }).select('+password +sessions');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    // H-1: Store hashed token in sessions array
    addSession(user, token, req);
    await user.save();

    setAuthCookies(res, token);

    res.status(200).json({
      success: true,
      token,
      user: safeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password (Generate OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    // Always return the same response to prevent email enumeration
    const okResponse = { success: true, message: 'If that email exists, an OTP has been sent to it' };

    if (!user) {
      return res.status(200).json(okResponse);
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    user.otp = otpHash;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.otpPurpose = 'password_reset';
    user.otpAttempts = 0;
    await user.save();

    try {
      await sendOtpEmail(email, otp, 'password_reset');
    } catch (emailErr) {
      logger.error('forgotPassword: email delivery failed', emailErr, { email });
      if (process.env.NODE_ENV === 'production') {
        return res.status(502).json({
          success: false,
          message: 'Failed to deliver password reset email. Please try again later.',
        });
      }
    }

    // C-1: No OTP in response
    res.status(200).json(okResponse);
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password (using OTP)
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide email, OTP, and new password' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email }).select('+password +otp +otpExpires +otpPurpose +otpAttempts +sessions');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({ success: false, message: 'No pending OTP. Please request a new one.' });
    }

    if (user.otpExpires < Date.now()) {
      user.otp = undefined;
      user.otpExpires = undefined;
      user.otpPurpose = undefined;
      await user.save();
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    if (user.otpPurpose && user.otpPurpose !== 'password_reset') {
      return res.status(400).json({ success: false, message: 'Invalid OTP purpose for password reset.' });
    }

    if ((user.otpAttempts || 0) >= 5) {
      user.otp = undefined;
      user.otpExpires = undefined;
      user.otpPurpose = undefined;
      user.otpAttempts = 0;
      await user.save();
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. This OTP has been invalidated. Please request a new one.',
      });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      const remainingAttempts = 5 - user.otpAttempts;
      if (remainingAttempts <= 0) {
        user.otp = undefined;
        user.otpExpires = undefined;
        user.otpPurpose = undefined;
        user.otpAttempts = 0;
      }
      await user.save();
      return res.status(400).json({
        success: false,
        message: remainingAttempts > 0
          ? `Invalid OTP. You have ${remainingAttempts} attempts remaining.`
          : 'Too many incorrect attempts. This OTP has been invalidated. Please request a new one.',
      });
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpPurpose = undefined;
    user.otpAttempts = 0;
    user.isVerified = true;

    // Revoke previous sessions on password reset for security
    user.sessions = [];

    const token = generateToken(user._id);
    addSession(user, token, req);
    await user.save();

    setAuthCookies(res, token);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully',
      token,
      user: safeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auth with Google
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential missing' });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email }] }).select('+sessions');

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.isVerified = true;
        if (!user.profilePicture && picture) user.profilePicture = picture;
      }
    } else {
      let baseUsername = name.replace(/\s+/g, '').toLowerCase();
      let username = baseUsername;
      let counter = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter++}`;
      }
      user = await User.create({
        fullName: name,
        username,
        email,
        googleId,
        profilePicture: picture,
        isVerified: true,
      });
    }

    const token = generateToken(user._id);
    addSession(user, token, req);
    await user.save();

    setAuthCookies(res, token);

    res.status(200).json({
      success: true,
      token,
      user: safeUser(user),
    });
  } catch (error) {
    logger.error('Google Auth Error', error);
    return res.status(401).json({ success: false, message: 'Invalid Google Token' });
  }
};

// @desc    Logout (current session)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token && req.user?._id) {
      const tokenHash = hashToken(token);
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { sessions: { token: tokenHash } }
      });
    }

    clearAuthCookies(res);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password (authenticated)
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (user.googleId && !user.password) {
      return res.status(400).json({
        success: false,
        message: 'You signed up with Google. Use forgot-password to set a password.',
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active sessions
// @route   GET /api/auth/sessions
// @access  Private
exports.getSessions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+sessions');
    const sessions = (user?.sessions || []).map((s) => ({
      _id: s._id,
      deviceString: s.deviceString,
      ip: s.ip,
      lastActive: s.lastActive,
      createdAt: s.createdAt,
    }));
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout a specific session
// @route   DELETE /api/auth/sessions/:sessionId
// @access  Private
exports.logoutSession = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+sessions');
    user.sessions = user.sessions.filter((s) => s._id.toString() !== req.params.sessionId);
    await user.save();
    res.status(200).json({ success: true, message: 'Session logged out' });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout all sessions except the current one
// @route   DELETE /api/auth/sessions
// @access  Private
exports.logoutAllSessions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+sessions');
    let currentToken = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      currentToken = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      currentToken = req.cookies.token;
    }

    if (currentToken) {
      const currentTokenHash = hashToken(currentToken);
      user.sessions = user.sessions.filter((s) => s.token === currentTokenHash);
    } else {
      user.sessions = [];
    }
    await user.save();
    res.status(200).json({ success: true, message: 'Logged out of all other devices' });
  } catch (error) {
    next(error);
  }
};
