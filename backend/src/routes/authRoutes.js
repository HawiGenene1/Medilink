const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register,
  login,
  getCurrentUser,
  verifyEmail
} = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
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
// @desc    Register a new customer
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

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authenticate, getCurrentUser);

// DEBUG ROUTE (Delete later)
router.get('/debug-user/:email', async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findOne({ email: req.params.email }).select('+password').populate('role');
    if (!user) return res.json({ found: false });
    return res.json({
      found: true,
      id: user._id,
      email: user.email,
      role: user.role,
      passwordHash: user.password
    });
  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }
});

// @desc    Request password reset
// @route   POST /api/auth/request-reset
// @access  Public
router.post("/request-reset", requestPasswordReset);

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
router.post("/reset-password/:token", resetPassword);

module.exports = router;
