const express = require('express');
const {
  signup,
  login,
  logout,
  checkUsername,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  googleAuth,
  changePassword,
  getSessions,
  logoutSession,
  logoutAllSessions
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const { 
  signupValidator, 
  loginValidator, 
  resetPasswordValidator, 
  forgotPasswordValidator, 
  verifyOtpValidator 
} = require('../validators/authValidator');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.post('/signup', signupValidator, validateRequest, signup);
router.post('/register', signupValidator, validateRequest, signup);
router.post('/login', loginValidator, validateRequest, login);
router.post('/check-username', checkUsername);
router.post('/verify-otp', verifyOtpValidator, validateRequest, verifyOTP);
router.post('/resend-otp', forgotPasswordValidator, validateRequest, resendOTP);
router.post('/forgot-password', forgotPasswordValidator, validateRequest, forgotPassword);
router.post('/reset-password', resetPasswordValidator, validateRequest, resetPassword);
router.post('/google', googleAuth);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});
router.put('/change-password', protect, changePassword);
router.get('/sessions', protect, getSessions);
router.delete('/sessions', protect, logoutAllSessions);
router.delete('/sessions/:sessionId', protect, logoutSession);

module.exports = router;
