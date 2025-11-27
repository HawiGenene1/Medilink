const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getCurrentUser } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const {
  requestPasswordReset,
  resetPassword,
} = require("../controllers/passwordController");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post(
  '/register',
  [
    body('firstName', 'First name is required').not().isEmpty(),
    body('lastName', 'Last name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  register
);

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

// @desc    Request password reset
// @route   POST /api/auth/request-reset
// @access  Public
router.post("/request-reset", requestPasswordReset);

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
router.post("/reset-password/:token", resetPassword);

module.exports = router;
