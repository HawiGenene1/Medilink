const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register,
  login,
  getCurrentUser,
  verifyEmail
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  requestPasswordReset,
  resetPassword,
} = require("../controllers/passwordController");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// Custom validation middleware to handle conditional password requirement
const validateRegistration = [
  body('firstName', 'First name is required').not().isEmpty().trim(),
  body('lastName', 'Last name is required').not().isEmpty().trim(),
  body('email', 'Please include a valid email').isEmail().normalizeEmail(),
  body('phone', 'Phone number is required').not().isEmpty().trim()
];

// @route   POST /api/auth/register
// @desc    Register a new user (Customer, Pharmacy, or Delivery)
// @access  Public
router.post('/register', validateRegistration, register);

// @route   GET /api/auth/verify-email/:token
// @desc    Verify email & activate account
// @access  Public
router.get('/verify-email/:token', verifyEmail);

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post(
  '/login',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists()
  ],
  login
);

// @desc    Verify 2FA code
// @route   POST /api/auth/verify-2fa
// @access  Public
router.post('/verify-2fa', require('../controllers/authController').verify2FA);

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, getCurrentUser);

// Password reset routes
router.post('/request-password-reset', requestPasswordReset);
router.post('/send-recovery-code', require("../controllers/passwordController").sendRecoveryCode);
router.post('/reset-password', resetPassword);

module.exports = router;
